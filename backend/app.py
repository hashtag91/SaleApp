from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request, send_file, send_from_directory, session, abort, current_app
from flask_login import login_user, logout_user, current_user, UserMixin, LoginManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_mail import Mail, Message
from sqlalchemy import func
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from datetime import date, datetime, timedelta
import csv
import io
import json
import os
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
load_dotenv()
from functools import wraps
import requests
import random
from collections import defaultdict
import re
from flask_socketio import SocketIO, emit

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pos.db'
app.secret_key = os.getenv("SECRET_KEY", "changeme")
app.config.update(
    MAIL_SERVER='smtp.gmail.com',
    MAIL_PORT=587,
    MAIL_USE_TLS=True,
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
)
mail = Mail(app)
API_KEY = os.getenv("API_KEY")

socketio = SocketIO(app, cors_allowed_origins="*")

UPLOAD_FOLDER = os.path.join(app.root_path, 'build/static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

db = SQLAlchemy(app)
migrate = Migrate(app, db)

login_manager = LoginManager(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sku = db.Column(db.String(80), unique=True, nullable=False)
    category = db.Column(db.String(225), nullable=False, default='defaut')
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=True)
    stock = db.Column(db.Integer, default=0)
    alert = db.Column(db.Integer, default=5)
    image_url = db.Column(db.String(200))
    parent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Pour les employés


class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Pour les employés
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float, nullable=False)
    items = db.Column(db.Text, nullable=False)
    seller = db.Column(db.String(200), nullable=False)  # Nom de l'utilisateur qui a créé le produit

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    surname = db.Column(db.String(80), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    entreprise = db.Column(db.String(80), nullable=True)
    adresse = db.Column(db.String(200), nullable=True)
    logo = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='autres')
    parent_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    tokens_conseil = db.Column(db.Integer, default=3)  # Nombre de tokens pour l'IA
    last_token_reset = db.Column(db.Date, default=date.today()) # Date de dernière mise à jour de tokens
    reset_code = db.Column(db.String(6), nullable=True) # Pour contenir le code de reinitialisation de mot de passe
    reset_code_expiration = db.Column(db.DateTime, nullable=True) # Date d'expiration du code de réinitialisation
    dark_mode = db.Column(db.Boolean, default=False)  # Préférence pour le mode sombre

    # Relation utile
    employees = db.relationship('User', backref=db.backref('parent', remote_side=[id]))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
class Categories(db.Model):
    id = db.Column(db.Integer, primary_key= True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    categorie = db.Column(db.String(225), nullable=False, default="defaut")

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(225), nullable=False)
    message = db.Column(db.String(255), nullable=False)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({'error': 'Authentification requise'}), 401
        return f(*args, **kwargs)
    return decorated_function

@socketio.on('join_admin')
def handle_join_admin(data):
    admin_id = data.get("admin_id")
    if admin_id:
        from flask_socketio import join_room
        join_room(f"admin_{admin_id}")
        emit("status", {"message": f"Admin {admin_id} connecté à sa room"})


# Décorateur pour vérifier que l'utilisateur est admin
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            abort(403)
        return f(*args, **kwargs)
    return decorated_function

def reset_tokens_if_needed(user):
    today = date.today()
    if user.last_token_reset != today:
        user.tokens_conseil = 3
        user.last_token_reset = today
        db.session.commit()

def generate_reset_code():
    """Génère un code de réinitialisation aléatoire de 6 chiffres."""
    return ''.join(random.choices('0123456789', k=6))

# Validation simple de l'email
def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def send_reset_email(email, reset_code):
    """Envoie un email de réinitialisation de mot de passe."""
    if not is_valid_email(email):
        return jsonify({'error': 'Email invalide.'}), 400
    msg = Message("Réinitialisation de votre mot de passe",
                  sender=os.getenv("MAIL_USERNAME"),
                  recipients=[email])
    msg.body = f"Votre code de réinitialisation est : {reset_code} pour réinitialiser votre mot de passe. Ce code est valable pendant 30 minutes."
    mail.send(msg)

def get_weeks_of_year():
    """
    Retourne une liste de tuples représentant chaque semaine de l'année en cours.
    Chaque tuple contient deux objets `date`, représentant la date de début et de fin de la semaine.

    Les semaines débutent toujours le lundi.
    """
    # Obtenir la date d'aujourd'hui
    today = date.today()
    
    # Définir la date du 1er janvier de cette année
    start_year = date(today.year, 1, 1)
    
    # Liste pour stocker les semaines de l'année
    weeks = []

    # Début de la prémière semaine de l'année
    current_start = start_year
    
    # Ajuster pour que la semaine commence le lundi
    # Si la date de début n'est pas un lundi, on la décalle
    if current_start.weekday() != 0:  # 0 = lundi
        current_start -= timedelta(days=current_start.weekday())

    # Boucle sur toutes les semaines
    while current_start <= today:
        # Fin de la semaine actuelle
        current_end = current_start + timedelta(days=6)
        
        # Si la date de fin est après la date d'aujourd'hui, on la met à aujourd'hui
        if current_end > today:
            current_end = today
        
        # Ajouter la semaine à la liste
        weeks.append((current_start, current_end))
        
        # Passer à la semaine suivante
        current_start = current_end + timedelta(days=1)

    # Retourner la liste des semaines
    return weeks

def get_months_of_year():
    today = date.today()
    year = today.year
    months = []

    for month in range(1, today.month + 1):
        start_month = date(year, month, 1)
        if month == 12:
            end_month = date(year, 12, 31)
        else:
            # Le dernier jour du mois = premier jour du mois suivant - 1 jour
            end_month = date(year, month + 1, 1) - timedelta(days=1)
        months.append((start_month, end_month))
    return months

@app.route('/api/contact', methods=['POST'])
@login_required
@admin_required
def contact():
    data = request.get_json()  # <- Ici, tu récupères le JSON envoyé par axios
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    # Validation
    if not name or not email or not message:
        return jsonify({'status': 'error', 'message': 'Tous les champs sont requis.'}), 400
    if not is_valid_email(email):
        return jsonify({'status': 'error', 'message': 'Email invalide.'}), 400

    try:
        # Envoi d'email
        msg = Message(subject=f"Nouveau message de {name}",
                      sender=os.getenv("MAIL_USERNAME"),
                      recipients=[os.getenv("MAIL_USERNAME")],
                      reply_to=email,
                      body=f"Nom : {name}\nEmail : {email}\n\nMessage :\n{message}")
        mail.send(msg)
        return jsonify({'status': 'success', 'message': 'Message envoyé avec succès ! La réponse sera envoyée par email.'})
    except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': 'Erreur lors de l’envoi du message. Veuillez réessayer plus tard.'}), 500

def is_safe_path(base_dir, path):
    basedir = os.path.abspath(base_dir)
    path = os.path.abspath(os.path.normpath(path))
    return os.path.commonprefix([path, basedir]) == basedir

@app.route('/api/theme', methods=['PUT'])
@login_required
def theme():

    data = request.form if request.form else request.get_json()
    dark_mode = str(data.get('dark_mode')).lower() == 'true'

    current_user.dark_mode = dark_mode
    db.session.commit()

    if dark_mode:
        return jsonify({'message': 'Mode sombre activé'}), 200
    else:
        return jsonify({'message': 'Mode sombre désactivé'}), 200

@app.route('/api/register', methods=['POST'])
def register():
    if User.query.filter_by(username=request.form.get('username')).first():
        return jsonify({'error': 'Username already exists'}), 400
    
     # Récupération et nettoyage des champs
    username = request.form.get('username', '').strip()
    password = request.form.get('password', '').strip()
    name = request.form.get('name', '').strip()
    surname = request.form.get('surname', '').strip()
    entreprise = request.form.get('entreprise', 'SALE APP').strip()
    adresse = request.form.get('adresse', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    logo = request.files.get('logo', None)
    safe_username = secure_filename(username)

    # Contrôles basiques
    if not username or not password or not name or not surname:
        return jsonify({'error': 'Les champs nom, prénom, username et mot de passe sont requis.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Ce nom d\'utilisateur est déjà pris.'}), 400

    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé.'}), 400
    
    logo_url = None
    if logo and allowed_file(logo.filename):
        filename = secure_filename(logo.filename)
        filename = f"{safe_username}_{filename}"

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], "logo")
        os.makedirs(filepath, exist_ok=True)
        logo_dir = os.path.join(filepath, filename)
        # Normalize and check that logo_dir is within the intended upload folder
        normalized_logo_dir = os.path.normpath(logo_dir)
        upload_root = os.path.abspath(app.config['UPLOAD_FOLDER'])
        if not normalized_logo_dir.startswith(upload_root):
            return jsonify({'error': 'Chemin non autorisé'}), 400

        logo.save(normalized_logo_dir)
        logo_url = filename
    else:
        logo_url = f"logo.jpg"  # Logo par défaut

    # Création de l'utilisateur
    user = User(
        username=username,
        name=name,
        surname=surname,
        entreprise=entreprise or f"{name} {surname}",
        adresse=adresse or None,
        logo=logo_url,
        phone=phone or None,
        email=email or None,
        role="admin",
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Utilisateur créé avec succès.'}), 201

@app.route('/api/forgot_password', methods=['POST'])
def forgot_password():
    email = request.form.get('email')
    print(email)
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({'error': 'Aucun utilisateur trouvé avec cet email.'}), 404

    # Génération du code de réinitialisation
    user.reset_code = generate_reset_code()
    user.reset_code_expiration = datetime.utcnow() + timedelta(minutes=30)
    db.session.commit()

    # Envoi du code par email (fonction fictive)
    send_reset_email(user.email, user.reset_code)

    session['reset_user_id'] = user.id  # Stocke l'ID de l'utilisateur dans la session pour la réinitialisation du mot de passe

    return jsonify({'message': 'Un email de réinitialisation a été envoyé.'}), 200

@app.route('/api/reset_password_code', methods=['POST'])
def reset_password_code():
    code = request.form.get('code')
    print(code)
    user = User.query.filter_by(id=session.get('reset_user_id')).first()
    if not user or user.reset_code != code:
        return jsonify({'error': 'Code invalide.'}), 400

    # Vérifier si le code de réinitialisation a expiré
    if user.reset_code_expiration < datetime.utcnow():
        return jsonify({'error': 'Code expiré.'}), 400
    
    # Si le code est valide, on peut permettre à l'utilisateur de réinitialiser son mot de passe
    return jsonify({'message': 'Code valide. Vous pouvez maintenant réinitialiser votre mot de passe.'}), 200
    
# Route pour réinitialiser le mot de passe lorsque sur oublié mot de passe
@app.route('/api/reset_forgot_password', methods=['POST'])
def reset_forgot_password():
    new_password = request.form.get('password')

    user = User.query.filter_by(id=session.get('reset_user_id')).first()

    # Mettre à jour le mot de passe
    user.set_password(new_password)
    user.reset_code = None
    user.reset_code_expiration = None
    db.session.commit()

    session.pop('reset_user_id', None)  # Supprimer l'ID de l'utilisateur de la session

    return jsonify({'message': 'Mot de passe mis à jour avec succès.'}), 200

# Route pour réinitialiser le mot de passe de l'utilisateur connecté
@app.route("/api/reset_password", methods=["POST"])
@login_required
def reset_password():
    """
    Réinitialise le mot de passe de l'utilisateur connecté.
    Les champs requis sont : 'oldPassword', 'newPassword', 'confirmPassword'.
    """
    old_password = request.form.get('oldPassword')
    new_password = request.form.get('newPassword')
    confirm_password = request.form.get('confirmPassword')

    if not old_password or not new_password or not confirm_password:
        return jsonify({'error': 'Tous les champs sont requis.'}), 400

    if not current_user.check_password(old_password):
        return jsonify({'error': 'Ancien mot de passe incorrect.'}), 400

    if new_password != confirm_password:
        return jsonify({'error': 'Les nouveaux mots de passe ne correspondent pas.'}), 400

    current_user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Mot de passe réinitialisé avec succès.'})

@app.route('/api/employees', methods=['POST'])
@login_required
@admin_required
def add_employee():
    if current_user.role != 'admin':
        abort(403)

    username = request.form.get('username', '').strip()
    password = request.form.get('password', '').strip()
    name = request.form.get('name', '').strip()
    surname = request.form.get('surname', '').strip()
    adresse = request.form.get('adresse', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    role = request.form.get('role', 'autres').strip()

    # Contrôles basiques
    if not username or not password or not name or not surname:
        return jsonify({'error': 'Les champs nom, prénom, username et mot de passe sont requis.'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Ce nom d\'utilisateur est déjà pris.'}), 400

    if email and User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé.'}), 400
    
    # Création de l'utilisateur
    user = User(
        username=username,
        name=name,
        surname=surname,
        entreprise=current_user.entreprise,
        adresse=adresse or None,
        logo=current_user.logo,
        phone=phone or None,
        email=email or None,
        role=role,
        parent_id=current_user.id  # Associe l'employé à l'utilisateur courant
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Utilisateur créé avec succès.'}), 201

@app.route("/api/employees/<int:id>", methods=["PUT"])
@login_required
@admin_required
def update_employee(id):
    employee = User.query.get_or_404(id)

    if current_user.role != 'admin':
        return jsonify({'error': 'Vous n\'avez pas cette autorisation.'}), 403

    data = request.get_json()

    print(data)

    employee.name = data.get('name')
    employee.surname = data.get('surname')
    employee.username = data.get('username')
    employee.phone = data.get('phone')
    employee.email = data.get('email')
    employee.adresse = data.get('adresse')
    employee.role = data.get('role')

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères.'}), 400
        employee.set_password(data.get('password'))

    db.session.commit()
    return jsonify({'message': 'Employé mis à jour avec succès !'})

@app.route('/api/employees', methods=['GET'])
@login_required
@admin_required
def get_employees():
    """
    Récupère la liste des employés de l'utilisateur connecté.
    Retourne un JSON contenant les informations de chaque employé.
    """
    employees = User.query.filter_by(parent_id=current_user.id).all()
    
    return jsonify([{
        'id': emp.id,
        'name': emp.name,
        'surname': emp.surname,
        'username': emp.username,
        'phone': emp.phone,
        'email': emp.email,
        'adresse': emp.adresse,
        'role': emp.role
    } for emp in employees])

@app.route("/api/employees/<int:id>", methods=["DELETE"])
@login_required
@admin_required
def delete_employee(id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Non autorisé'}), 403

    user = User.query.get_or_404(id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'Employé supprimé avec succès'})

@app.route('/api/best_seller', methods=['GET'])
@login_required
@admin_required
def best_seller():
    # Date actuelle
    now = datetime.now()
    year, month = now.year, now.month

    # Regrouper par vendeur et calculer le total
    # Trouver le vendeur qui a vendu le plus cher en ce mois-ci
    # Grouper les ventes par vendeur, calculer le total par vendeur,
    # et trier les résultats par total décroissant
    # Sélectionner le premier résultat, c'est-à-dire le vendeur qui a vendu le plus cher
    best = (
        db.session.query(
            Sale.seller,
            func.sum(Sale.total).label("total_sales")
        )
        .filter(func.strftime('%Y', Sale.date) == str(year))
        .filter(func.strftime('%m', Sale.date) == f"{month:02d}")
        .group_by(Sale.seller)
        .order_by(func.sum(Sale.total).desc())
        .first()
    )

    if best:
        return jsonify({"seller": best.seller, "total_sales": float(best.total_sales)})
    else:
        return jsonify({"message": "Aucune vente ce mois"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Identifiants invalides'}), 401
    login_user(user)
    reset_tokens_if_needed(current_user)
    return jsonify({'message': 'Connecté'})

@app.route('/api/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Déconnecté'})

@app.route('/api/me')
def get_current_user():
    user = User.query.get(current_user.id)
    return jsonify({'user': {
        'id': user.id,
        'user': user.username,
        'name': user.name,
        'surname': user.surname,
        'entreprise': user.entreprise,
        'phone': user.phone,
        'email': user.email,
        'adresse': user.adresse,
        'logo': user.logo,
        'role': user.role,
        'tokens_conseil': user.tokens_conseil,
        'dark_mode' : user.dark_mode,
        'parent_id' : current_user.parent_id or current_user.id
    }})

@app.route('/api/notifications/<int:id>', methods=['GET'])
@login_required
@admin_required
def get_notif(id):
    notifications = Notification.query.filter_by(admin_id=id).all()
    notifications.reverse()
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'sale_id': n.sale_id,
        'is_read': n.is_read,
        'created_at': n.created_at
    } for n in notifications])

@app.route('/api/notification/<int:id>', methods=['PUT'])
@login_required
@admin_required
def read_notification(id):
    notification = Notification.query.get_or_404(id)
    notification.is_read = True
    db.session.commit()
    return jsonify({'message': 'Notification marquée comme lue'})

@app.route('/api/settings', methods=['GET'])
@login_required
def settings():
    """
    Récupère et retourne les informations du profil utilisateur actuellement connecté.
    Cette fonction extrait l'identifiant de l'utilisateur depuis la session, récupère l'utilisateur correspondant dans la base de données, puis retourne ses informations sous forme de JSON. 
    Si l'utilisateur n'est pas trouvé, une erreur 404 est retournée.
    Retour :
        - 200: Un objet JSON contenant les champs suivants :
            - name (str): Le prénom de l'utilisateur, ou une chaîne vide si non défini.
            - surname (str): Le nom de famille de l'utilisateur, ou une chaîne vide si non défini.
            - username (str): Le nom d'utilisateur, ou une chaîne vide si non défini.
            - phone (str): Le numéro de téléphone, ou une chaîne vide si non défini.
            - email (str): L'adresse email, ou une chaîne vide si non défini.
            - entreprise (str): Le nom de l'entreprise, ou une chaîne vide si non défini.
            - adresse (str): L'adresse, ou une chaîne vide si non défini.
        - 404: Un objet JSON avec une clé 'error' si l'utilisateur n'est pas trouvé.
    Exemple de réponse (succès) :
    {
        "name": "Jean",
        "surname": "Dupont",
        "username": "jdupont",
        "phone": "0601020304",
        "email": "jean.dupont@email.com",
        "entreprise": "MaSociete",
        "adresse": "12 rue Exemple, Paris"
    }
    Exemple de réponse (erreur) :
    {
        "error": "Utilisateur non trouvé"
    }
    """
    user_id = current_user.id
    user = User.query.filter_by(id=user_id).first()

    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    name = user.name or ''
    surname = user.surname or ''
    username = user.username or ''
    phone = user.phone or ''
    email = user.email or ''
    entreprise = user.entreprise or ''
    adresse = user.adresse or ''

    return jsonify({
        'name': name,
        'surname': surname,
        'username': username,
        'phone': phone,
        'email': email,
        'entreprise': entreprise,
        'adresse': adresse
    })

@app.route('/api/settings', methods=['POST'])
@login_required
def update_settings():
    user_id = current_user.id
    
    name = request.form.get('name', '').strip()
    surname = request.form.get('surname', '').strip()
    username = request.form.get('username', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    entreprise = request.form.get('entreprise', '').strip()
    adresse = request.form.get('adresse', '').strip()
    logo = request.files.get('logo', None)

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    user.name = name
    user.surname = surname
    user.username = username
    user.phone = phone
    user.email = email
    user.entreprise = entreprise
    user.adresse = adresse

    
    if logo:
        filename = secure_filename(logo.filename)

        if not allowed_file(filename):
            return jsonify({'error': 'Format de fichier non autorisé'}), 400

        # Sanitize username as well
        safe_username = secure_filename(username)
        filename = f"{safe_username}_{filename}"

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], "logo")
        os.makedirs(filepath, exist_ok=True)
        logo_dir = os.path.join(filepath, filename)
        # Normalize the path and check containment
        normalized_logo_dir = os.path.normpath(logo_dir)
        upload_folder_abs = os.path.abspath(app.config['UPLOAD_FOLDER'])
        if not normalized_logo_dir.startswith(upload_folder_abs):
            return jsonify({'error': 'Chemin non autorisé'}), 400

        logo.save(normalized_logo_dir)
        user.logo = filename

    db.session.commit()
    return jsonify({'message': 'Paramètres mis à jour avec succès.'})

@app.route('/api/products', methods=['GET'])
@login_required
def get_products():
    if current_user.role != 'admin':
        user_id = current_user.parent_id or current_user.id
    else:
        user_id = current_user.id
    products = Product.query.filter_by(user_id=user_id).all()
    products.reverse()
    return jsonify([{
        'id': p.id,
        'sku': p.sku,
        'name': p.name,
        'price': p.price,
        'buy_price': p.buy_price,
        'category': p.category,
        'stock': p.stock,
        'alert': p.alert,
        'imageUrl': p.image_url
    } for p in products])

@app.route('/api/products', methods=['POST'])
@login_required
@admin_required
def add_product():
    user_id = current_user.id
    image = request.files.get('image')
    sku = request.form.get('sku')
    name = request.form.get('name')
    category = request.form.get('category')
    price = request.form.get('price')
    buy_price = request.form.get('buy_price')
    stock = request.form.get('stock')
    alert = request.form.get('alert')

    if not sku or not name or not price or not buy_price or not stock:
        return jsonify({'error': 'Champs requis'}), 400

    if Product.query.filter_by(sku=sku).first():
        return jsonify({'error': 'SKU déjà utilisé'}), 400

    image_url = None
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        filename = f"{int(datetime.now().timestamp())}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image.save(filepath)
        image_url = f"/static/uploads/{filename}"

    product = Product(
        user_id=user_id,
        sku=sku,
        name=name,
        category=category,
        price=float(price),
        buy_price=float(buy_price),
        stock=int(stock),
        alert=int(alert),
        image_url=image_url,
        parent_id=current_user.parent_id or current_user.id,  # Pour les employés, on utilise parent_id (id de l'admin) pour lier le produit à l'entreprise
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({
        'id': product.id,
        'sku': product.sku,
        'name': product.name,
        'category': product.category,
        'price': product.price,
        'buy_price': product.buy_price,
        'stock': product.stock,
        'imageUrl': product.image_url
    }), 201

@app.route('/api/category', methods=['GET'])
@login_required
@admin_required
def get_category():
    try:
        parent_id = current_user.parent_id or current_user.id
        categories = Categories.query.filter_by(user_id=parent_id).all()
        categories.reverse()

        return jsonify([
            {
                'id': c.id,
                'category': c.categorie,
                'user_id': c.user_id
            }
            for c in categories
        ])
    except Exception as e:
        print("Erreur Flask:", e)  # log dans la console
        return jsonify({"error": str(e)}), 500

@app.route('/api/category', methods=['POST'])
@login_required
@admin_required
def add_category():
    parent_id = current_user.parent_id or current_user.id
    data = request.get_json()
    category = data.get('category') if data else None

    if not category:
        return jsonify({'error':'Le champ est vide'}), 400
    
    c = Categories(categorie=category, user_id=parent_id)
    db.session.add(c)
    db.session.commit()

    return jsonify({
        'message':'Catégorie ajoutée avec succès'
    })

@app.route('/api/category/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def delete_category(id):
    c = Categories.query.get_or_404(id)
    db.session.delete(c)
    db.session.commit()
    return jsonify({
        'message':'Catégorie supprimé avec succès'
    })

@app.route('/api/products/<int:id>', methods=['PUT'])
@login_required
@admin_required
def update_product(id):
    """
    Met à jour les informations d'un produit existant dans la base de données.
    Paramètres :
        id (int) : L'identifiant unique du produit à mettre à jour.
    Traitement :
        - Récupère le produit correspondant à l'identifiant fourni.
        - Met à jour les champs du produit (SKU, nom, prix, prix d'achat, stock) si de nouvelles valeurs sont fournies dans la requête.
        - Vérifie l'unicité du SKU avant de le modifier.
        - Gère le téléchargement et l'enregistrement d'une nouvelle image si elle est fournie.
        - Enregistre les modifications dans la base de données.
    Retour :
        - Un objet JSON contenant un message de succès ou une erreur si le SKU est déjà utilisé.
    """

    p = Product.query.get_or_404(id)
    sku = request.form.get('sku')
    name = request.form.get('name')
    price = request.form.get('price')
    buy_price = request.form.get('buy_price')
    category = request.form.get('category')
    stock = request.form.get('stock')
    alert = request.form.get('alert')

    if sku and sku != p.sku:
        if Product.query.filter_by(sku=sku).first():
            return jsonify({'error': 'SKU déjà utilisé'}), 400
        p.sku = sku

    if name: p.name = name
    if price: p.price = float(price)
    if buy_price: p.buy_price = float(buy_price)
    if stock: p.stock = int(stock)
    if alert: p.alert = int(alert)
    if category: p.category = category

    if 'image' in request.files:
        image = request.files['image']
        if image.filename:
            filename = secure_filename(image.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            p.image_url = f"/static/uploads/{filename}"

    db.session.commit()
    return jsonify({'message': 'Produit mis à jour avec succès'})

@app.route('/api/products/<int:id>', methods=['DELETE'])
@login_required
@admin_required
def delete_product(id):
    p = Product.query.get_or_404(id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Product deleted'})

@app.route('/api/products/search', methods=['GET'])
@login_required
def search_products():
    """
    Recherche des produits en fonction du SKU fourni en paramètre de requête.
    Cette fonction récupère la valeur du paramètre 'sku' depuis les arguments de la requête HTTP.
    Si le SKU n'est pas fourni ou est vide, elle retourne une liste vide au format JSON.
    Sinon, elle effectue une recherche dans la base de données pour trouver tous les produits dont le SKU contient la valeur recherchée.
    Les résultats sont retournés sous forme de liste d'objets JSON contenant les informations principales de chaque produit.
    Retour :
        Response : Liste JSON des produits correspondant au SKU recherché.
    """

    sku = request.args.get('sku', '').strip()
    if not sku:
        return jsonify([])
    products = Product.query.filter(Product.sku.like(f"%{sku}%")).all()
    return jsonify([{
        'id': p.id,
        'sku': p.sku,
        'name': p.name,
        'price': p.price,
        'buy_price': p.buy_price,
        'stock': p.stock,
        'imageUrl': p.image_url
    } for p in products])

@app.route('/api/sales', methods=['POST'])
@login_required
def record_sale():
    parent_id = current_user.parent_id or current_user.id # Pour les employés, on utilise parent_id (id de l'admin) pour lier la vente à l'entreprise
    user_id = current_user.id
    data = request.get_json()
    s = Sale(parent_id=parent_id, user_id=user_id, total=data['total'], items=data['items'], seller=f"{current_user.name} {current_user.surname}")
    db.session.add(s)
    for item in data['cart']:
        product = Product.query.filter_by(id=item['id']).first()
        if product and product.stock >= item['qty']:
            product.stock -= item['qty']
    db.session.commit()

    socketio.emit(
        'Nouvelle vente',
        {
            'id': s.id,
            'total': s.total,
            'seller': s.seller,
            'date': s.date.isoformat()
        },
        room=f"admin_{parent_id}")  # chaque admin a sa "room"

    notification = Notification(
        admin_id=parent_id,
        title='Nouvelle vente',
        message=f"Une nouvelle vente a été enregistrée : {s.id}",
        sale_id=s.id,
        is_read=False
    )
    db.session.add(notification)
    db.session.commit()

    return jsonify({'message': 'Vente enregistrée'})

@app.route('/api/sales', methods=['GET'])
@login_required
def get_sales():
    """Le filtre est appliqué en fonction du rôle de l'utilisateur. L'Admin ayant son id sur toutes les lignes de ventes de l'entreprise dans la colonne 'parent_id' de la table Sale 
    verra toutes les ventes de l'entreprise, tandis que les employés verront uniquement leurs propres ventes."""
    parent_id = current_user.parent_id or current_user.id
    if current_user.role == 'admin':
        sales = Sale.query.filter_by(parent_id=parent_id).order_by(Sale.date.desc()).all()
    else:
        sales = Sale.query.filter_by(user_id=current_user.id).order_by(Sale.date.desc()).all()
    return jsonify([{
        'id': s.id,
        'date': s.date.isoformat(),
        'total': s.total,
        'items': s.items,
        'seller': s.seller  # Ajout du nom du vendeur
    } for s in sales])

@app.route('/api/prevision-moyenne', methods=['GET'])
@login_required
@admin_required
def prevision_moyenne():
    parent_id = current_user.parent_id or current_user.id
    try:
        # 1️⃣ Récupérer les ventes des 7 derniers jours pour l'utilisateur courant
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        ventes = Sale.query.filter(
            Sale.date >= seven_days_ago,
            Sale.parent_id == parent_id
        ).all()

        # 2️⃣ Transformer les ventes en liste de dictionnaires
        data = []
        for sale in ventes:
            items = json.loads(sale.items)
            for item in items:
                data.append({
                    "date": sale.date.strftime('%Y-%m-%d'),
                    "sku": item.get("sku"),
                    "qty": item.get("qty", 1)
                })
        if not data:
            return jsonify({})  # aucun résultat

        # 3️⃣ Agréger les ventes par jour et produit
        stats = defaultdict(lambda: defaultdict(int))
        for v in data:
            day = datetime.strptime(v['date'], '%Y-%m-%d').day
            stats[day][v['sku']] += v['qty']

        # 4️⃣ Calculer la prévision simple par produit
        totals = defaultdict(list)
        for day, products in stats.items():
            for sku, qty in products.items():
                totals[sku].append(qty)

        forecast = {sku: int(sum(qtys)/len(qtys)) for sku, qtys in totals.items()}
        return jsonify(forecast)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ventes-7-jours", methods=["GET"])
@login_required
@admin_required
def ventes_7_dernieres():
    parent_id = current_user.parent_id or current_user.id
    results = (
        db.session.query(
            func.date(Sale.date).label("day"),
            func.sum(Sale.total).label("ventes")
        )
        .filter(Sale.parent_id == parent_id)   # 🔹 filtre par utilisateur
        .group_by(func.date(Sale.date))
        .order_by(func.date(Sale.date).desc())
        .limit(7)
        .all()
    )

    # Remettre en ordre chronologique (ancien → récent)
    results = results[::-1]

    return jsonify([{"day": f'{r.day.split("-")[2]}-{r.day.split("-")[1]}', "ventes": float(r.ventes)} for r in results])

@app.route('/api/weekly-sales', methods=['GET'])
@login_required
@admin_required
def weekly_sales():
    """
    Retourne les ventes hebdomadaires de l'année courante pour l'utilisateur courant.
    Les données sont retournées sous la forme d'une liste de dictionnaires, chaque dictionnaire contenant les clés 'day' (représentant la semaine) et 'ventes' (représentant le total de ventes).
    Les données sont retournées pour les 5 semaines les plus récentes.
    """
    parent_id = current_user.parent_id or current_user.id

    # Récupérer toutes les ventes depuis le début de l'année
    start_year = date(date.today().year, 1, 1)
    sales = (
        db.session.query(Sale.date, Sale.total)
        .filter(Sale.parent_id == parent_id, Sale.date >= start_year)
        .all()
    )

    # Créer un dict pour stocker le total par semaine
    weekly_totals = {}
    weeks = get_weeks_of_year()

    # Remplir le dictionnaire avec les semaines de l'année
    for start_week, end_week in weeks:
        week_label = f"{start_week.strftime('%d')} - {end_week.strftime('%d')}"
        weekly_totals[week_label] = 0

    # Ajouter les ventes dans la bonne semaine
    for sale_date, total in sales:
        for start_week, end_week in weeks:
            if start_week <= sale_date.date() <= end_week:
                week_label = f"{start_week.strftime('%d')} - {end_week.strftime('%d')}"
                weekly_totals[week_label] += float(total)
                break

    # Transformer en liste pour JSON
    result = [
        {"day": week, "ventes": total} 
        for week, total in weekly_totals.items()
    ][-5:]  # Retourner les 5 semaines les plus récentes

    return jsonify(result)

@app.route('/api/monthly-sales', methods=['GET'])
@login_required
@admin_required
def monthly_sales():
    parent_id = current_user.parent_id or current_user.id

    # Récupérer toutes les ventes depuis le début de l'année
    start_year = date(date.today().year, 1, 1)
    sales = (
        db.session.query(Sale.date, Sale.total)
        .filter(Sale.parent_id == parent_id, Sale.date >= start_year)
        .all()
    )

    # Créer un dict pour stocker le total par mois
    monthly_totals = {}
    months = get_months_of_year()

    for start_month, end_month in months:
        month_label = start_month.strftime("%m %y")  # ex: "Août 2025"
        monthly_totals[month_label] = 0

    # Ajouter les ventes dans le bon mois
    for sale_datetime, total in sales:
        sale_date = sale_datetime.date()  # <-- conversion datetime -> date
        for start_month, end_month in months:
            if start_month <= sale_date <= end_month:
                month_label = start_month.strftime("%m %y")
                monthly_totals[month_label] += float(total)
                break

    # Transformer en liste pour JSON
    result = [{"day": month, "ventes": total} for month, total in monthly_totals.items()][-7:]
    return jsonify(result)

@app.route("/api/annual-sales", methods=["GET"])
@login_required
@admin_required
def annual_sales():
    parent_id = current_user.parent_id or current_user.id

    # Récupérer la première vente
    first_sale = (
        db.session.query(Sale.date)
        .filter(Sale.parent_id == parent_id)
        .order_by(Sale.date.asc())
        .first()
    )

    if not first_sale:
        return jsonify([])  # Pas de ventes

    start_year = first_sale.date.year - 1
    current_year = date.today().year

    # Générer toutes les années entre la première vente et l'année actuelle
    years = list(range(start_year, current_year + 1))

    # Initialiser le total par année
    annual_totals = {year: 0 for year in years}

    # Récupérer toutes les ventes depuis la première vente
    sales = (
        db.session.query(Sale.date, Sale.total)
        .filter(Sale.parent_id == parent_id, Sale.date >= first_sale.date)
        .all()
    )

    # Calculer le total par année
    for sale_datetime, total in sales:
        year = sale_datetime.year
        annual_totals[year] += float(total)

    # Transformer en JSON
    result = [{"day": str(year), "ventes": total} for year, total in annual_totals.items()]
    return jsonify(result)


@app.route('/api/facture', methods=['POST'])
def generer_facture_pdf():
    """
    Génère une facture PDF à partir des données de vente reçues en POST.
    Cette route attend une requête POST contenant les informations suivantes au format JSON :
        - client (str) : Le nom du client.
        - items (str, JSON) : Liste des articles vendus, chaque article étant un dictionnaire avec au moins les clés 'name', 'qty', 'price'.
        - total (float) : Le montant total de la facture.
    Étapes principales :
        1. Récupère et parse les données envoyées (client, items, total).
        2. Génère un numéro de facture unique basé sur la date et l'heure.
        3. Crée un PDF en mémoire avec ReportLab :
            - Ajoute le logo de l'utilisateur (ou un logo par défaut).
            - Affiche les coordonnées de l'entreprise (nom, adresse, téléphone, email).
            - Affiche les informations de la facture (numéro, date, client).
            - Génère un tableau listant chaque article (description, quantité, prix unitaire, total ligne).
            - Affiche le total général en bas de la facture.
        4. Gère le saut de page si la liste des articles est longue.
        5. Retourne le PDF généré en pièce jointe, prêt à être téléchargé.
    Retour :
        - Un fichier PDF nommé "facture_<numero_facture>.pdf" contenant la facture générée.
    Remarques :
        - L'utilisateur doit être authentifié (utilisation de la session pour récupérer l'utilisateur courant).
        - Si le logo de l'utilisateur n'est pas trouvé, un logo par défaut est utilisé.
        - Les montants sont affichés en FCFA.
    """
    data = request.get_json()

    nom_client = data.get('client')
    items = json.loads(data.get('items', '[]'))  # liste de dicts : [{description, qty, price}]
    total = data.get('total')
    numero_facture = f"FAC-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    # Création du PDF en mémoire
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    largeur, hauteur = A4

    user_id = current_user.id
    user = User.query.get(user_id)
    # Logo
    root_app = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(root_app, 'build', 'static', 'uploads', 'logo', user.logo) if user and user.logo else os.path.join(root_app, 'build', 'static', 'logo.jpg')
    if os.path.exists(logo_path):
        c.drawImage(logo_path, 20 * mm, hauteur - 50 * mm, width=30 * mm, height=30 * mm, preserveAspectRatio=True, mask='auto')

    # Coordonnées entreprise
    c.setFont("Helvetica-Bold", 16)
    c.drawString(60 * mm, hauteur - 30 * mm, user.entreprise or "Nom de l'entreprise")
    c.setFont("Helvetica", 10)
    c.drawString(60 * mm, hauteur - 35 * mm, user.adresse or "Votre adresse ici")
    c.drawString(60 * mm, hauteur - 40 * mm, f"Tel: +223 {user.phone}" if user.phone else "Tel: N/A")
    c.drawString(60 * mm, hauteur - 45 * mm, f"Email: {user.email}" if user.email else "Email: N/A")

    c.line(20 * mm, hauteur - 50 * mm, 190 * mm, hauteur - 50 * mm)

    # Infos facture
    c.setFont("Helvetica-Bold", 12)
    c.drawString(20 * mm, hauteur - 60 * mm, f"Facture N°: {numero_facture}")
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, hauteur - 70 * mm, f"Date: {datetime.now().strftime('%d/%m/%Y')}")
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, hauteur - 80 * mm, f"Client: {nom_client}")

    # Tableau
    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, hauteur - 110 * mm, "Description")
    c.drawString(100 * mm, hauteur - 110 * mm, "Qté")
    c.drawString(120 * mm, hauteur - 110 * mm, "Prix Unitaire")
    c.drawString(160 * mm, hauteur - 110 * mm, "Total")

    y = hauteur - 120 * mm
    c.setFont("Helvetica", 10)
    for item in items:
        description = item.get('name', '')
        qty = item.get('qty', 0)
        price = item.get('price', 0)
        total_ligne = qty * price

        c.drawString(20 * mm, y, description)
        c.drawString(100 * mm, y, str(qty))
        c.drawString(120 * mm, y, f"{price:.2f} FCFA")
        c.drawString(160 * mm, y, f"{total_ligne:.2f} FCFA")
        y -= 10 * mm

        if y < 30 * mm:
            c.showPage()
            y = hauteur - 30 * mm

    c.line(120 * mm, y - 5 * mm, 190 * mm, y - 5 * mm)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(120 * mm, y - 15 * mm, "Total:")
    c.drawString(160 * mm, y - 15 * mm, f"{total:.2f} FCFA")

    c.showPage()
    c.save()

    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name=f"facture_{numero_facture}.pdf", mimetype='application/pdf')

@app.route('/api/sales/export', methods=['GET'])
def export_sales_csv():
    """
    Exports sales data as a CSV file for the authenticated user, optionally filtered by start and end dates.
    Query Parameters:
        start (str, optional): ISO format date string to filter sales from this date (inclusive).
        end (str, optional): ISO format date string to filter sales up to this date (inclusive).
    Returns:
        Response: A CSV file ('sales.csv') containing the filtered sales data with columns: ID, Date, Total, Items.
    """
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    query = Sale.query.filter(Sale.user_id == current_user.id)
    if start_date:
        query = query.filter(Sale.date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Sale.date <= datetime.fromisoformat(end_date))

    sales = query.order_by(Sale.date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Date', 'Total', 'Items'])

    for s in sales:
        writer.writerow([s.id, s.date.isoformat(), s.total, s.items])

    output.seek(0)
    return send_file(io.BytesIO(output.getvalue().encode()), mimetype='text/csv', as_attachment=True, download_name='sales.csv')

@app.route('/api/ai/conseil', methods=['POST'])
@login_required
@admin_required
def conseil_ventes():
    """
    Analyse l'historique des ventes fourni en JSON, identifie les tendances, estime les revenus futurs, 
    détermine les produits les plus populaires et fournit des conseils de réapprovisionnement en français 
    en utilisant un modèle d'IA externe.
    Retourne :
        - 200 et une réponse contenant les conseils générés par l'IA si l'analyse réussit.
        - 400 si aucune donnée de vente n'est fournie.
        - 500 en cas d'erreur lors de l'appel à l'IA.
    Exemple de données attendues :
        [
            {"produit": "Produit A", "quantite": 10, "date": "2024-06-01"},
            {"produit": "Produit B", "quantite": 5, "date": "2024-06-02"}
        ]
    """
    if current_user.tokens_conseil <= 0:
        return jsonify({'error': "Limite de 3 conseils IA atteinte pour aujourd'hui."}), 403
    
    data = request.get_json()

    if not data or len(data) == 0:
        return jsonify({'response': "Aucune donnée de vente fournie."}), 400

    prompt = f"Voici un historique de ventes sous forme JSON. Analyse les tendances, estime les revenus futurs, identifie les produits les plus populaires et donne des conseils précis sur les réapprovisionnements en français. {json.dumps(data)}"

    try:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}"
        }
        data = {
            "model": "meta-llama/llama-4-scout-17b-16e-instruct",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        response = requests.post(url, headers=headers, json=data)

        # Affiche la réponse JSON
        content = response.json().get('choices', [{}])[0].get('message', {}).get('content', "Aucune réponse de l'IA.")

        # ✅ Consommer un jeton
        current_user.tokens_conseil -= 1
        db.session.commit()

        if not content:
            return jsonify({'error': "Aucune réponse de l'IA."}), 500
        return jsonify({"response": {"message": content, "tokens_conseil": current_user.tokens_conseil}}), 200

    except Exception as e:
        print(e)
        return jsonify({'error': "Erreur lors de l'analyse IA."}), 500

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host="0.0.0.0")

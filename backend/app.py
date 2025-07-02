from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, jsonify, request, send_file, send_from_directory, session
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from datetime import datetime
import csv
import io
import json
import os
import requests
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
load_dotenv()
from functools import wraps

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pos.db'
app.secret_key = os.getenv("SECRET_KEY", "changeme")

UPLOAD_FOLDER = os.path.join(app.root_path, 'build/static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

db = SQLAlchemy(app)
migrate = Migrate(app, db)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    sku = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=True)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(200))

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float, nullable=False)
    items = db.Column(db.Text, nullable=False)

class User(db.Model):
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
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
    adresse = request.form.get('adress', '').strip()
    adresse = request.form.get('adresse', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    logo = request.files.get('logo', None)

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
        filename = f"{username}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], f"logo/{filename}")
        logo.save(filepath)
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
        email=email or None
    )
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'Utilisateur créé avec succès.'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Identifiants invalides'}), 401
    session['user_id'] = user.id
    return jsonify({'message': 'Connecté'})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Déconnecté'})

@app.route('/api/me')
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'user': None})
    user = User.query.get(session['user_id'])
    return jsonify({'user': {
        'user': user.username,
        'name': user.name,
        'surname': user.surname,
        'entreprise': user.entreprise,
        'phone': user.phone,
        'email': user.email
    }})

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentification requise'}), 401
        return f(*args, **kwargs)
    return decorated_function

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
    user_id = session.get('user_id')
    user = User.query.filter_by(id=user_id).first()
    print(user)

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
    user_id = session.get('user_id')
    
    name = request.form.get('name', '').strip()
    surname = request.form.get('surname', '').strip()
    username = request.form.get('username', '').strip()
    phone = request.form.get('phone', '').strip()
    email = request.form.get('email', '').strip()
    entreprise = request.form.get('entreprise', '').strip()
    adresse = request.form.get('adresse', '').strip()
    logo = request.files.get('logo', None)
    password = request.form.get('password', '').strip()

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

    if password:
        if len(password) < 6:
            return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères.'}), 400
        user.set_password(password)
    if logo:
        filename = secure_filename(logo.filename)
        if not allowed_file(filename):
            return jsonify({'error': 'Format de fichier non autorisé'}), 400
        filename = f"{username}_{filename}"
        logo_path = os.path.join(app.config['UPLOAD_FOLDER'], 'logo', filename)
        logo.save(logo_path)
        user.logo = filename
        user.logo = logo_path

    db.session.commit()
    return jsonify({'message': 'Paramètres mis à jour avec succès.'})

@app.route('/api/products', methods=['GET'])
@login_required
def get_products():
    user_id = session.get('user_id')
    products = Product.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': p.id,
        'sku': p.sku,
        'name': p.name,
        'price': p.price,
        'buy_price': p.buy_price,
        'stock': p.stock,
        'imageUrl': p.image_url
    } for p in products])

@app.route('/api/products', methods=['POST'])
@login_required
def add_product():
    user_id = session.get('user_id')
    image = request.files.get('image')
    sku = request.form.get('sku')
    name = request.form.get('name')
    price = request.form.get('price')
    buy_price = request.form.get('buy_price')
    stock = request.form.get('stock')

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
        price=float(price),
        buy_price=float(buy_price),
        stock=int(stock),
        image_url=image_url
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({
        'id': product.id,
        'sku': product.sku,
        'name': product.name,
        'price': product.price,
        'buy_price': product.buy_price,
        'stock': product.stock,
        'imageUrl': product.image_url
    }), 201

@app.route('/api/products/<int:id>', methods=['PUT'])
@login_required
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
    stock = request.form.get('stock')

    if sku and sku != p.sku:
        if Product.query.filter_by(sku=sku).first():
            return jsonify({'error': 'SKU déjà utilisé'}), 400
        p.sku = sku

    if name: p.name = name
    if price: p.price = float(price)
    if buy_price: p.buy_price = float(buy_price)
    if stock: p.stock = int(stock)

    if 'image' in request.files:
        image = request.files['image']
        if image.filename:
            filename = secure_filename(image.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            image.save(filepath)
            p.image_url = f"/static/uploads/{filename}"

    db.session.commit()
    return jsonify({'message': 'Product updated'})

@app.route('/api/products/<int:id>', methods=['DELETE'])
@login_required
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
    user_id = session.get('user_id')
    data = request.get_json()
    s = Sale(user_id=user_id, total=data['total'], items=data['items'])
    db.session.add(s)
    for item in data['cart']:
        product = Product.query.filter_by(id=item['id'], user_id=user_id).first()
        if product and product.stock >= item['qty']:
            product.stock -= item['qty']
    db.session.commit()
    if data.get('generate_invoice', False):
        # Here you would generate an invoice PDF, but for simplicity, we skip this step
        print("Génération de la facture PDF (non implémentée)")
    return jsonify({'message': 'Vente enregistrée'})

@app.route('/api/sales', methods=['GET'])
@login_required
def get_sales():
    user_id = session.get('user_id')
    sales = Sale.query.filter_by(user_id=user_id).order_by(Sale.date.desc()).all()
    return jsonify([{
        'id': s.id,
        'date': s.date.isoformat(),
        'total': s.total,
        'items': s.items
    } for s in sales])

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

    user_id = session.get('user_id')
    user = User.query.get(user_id)
    # Logo
    root_app = os.path.dirname(os.path.abspath(__file__))
    logo_path = os.path.join(root_app, 'build', 'static', 'uploads', 'logo', user.logo) if user and user.logo else os.path.join(root_app, 'build', 'static', 'logo.jpg')
    print(logo_path)
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
    print(type(items))
    for item in items:
        print(type(item))
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
    query = Sale.query.filter(Sale.user_id == session.get('user_id'))
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

    data = request.get_json()

    if not data or len(data) == 0:
        return jsonify({'response': "Aucune donnée de vente fournie."}), 400

    prompt = f"Voici un historique de ventes sous forme JSON. Analyse les tendances, estime les revenus futurs, identifie les produits les plus populaires et donne des conseils précis sur les réapprovisionnements en français. {json.dumps(data)}"

    try:
        res = requests.post("http://localhost:11434/api/generate", json={
            "model": "deepseek-r1:1.5b",
            "prompt": prompt,
            "stream": False
        })

        res.raise_for_status()
        output = res.json()
        print(output)
        content = output.get('response', "Aucune réponse de l'IA.")
        return jsonify({"response": content}), 200

    except Exception as e:
        print("Erreur IA:", e)
        return jsonify({'response': "Erreur lors de l'analyse IA."}), 500

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0")

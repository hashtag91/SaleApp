from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import csv
import io
import os
from werkzeug.utils import secure_filename

app = Flask(__name__, static_folder='build', static_url_path='')
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///pos.db'

UPLOAD_FOLDER = os.path.join(app.root_path, 'build/static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

db = SQLAlchemy(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(80), nullable=False)
    price = db.Column(db.Float, nullable=False)
    buy_price = db.Column(db.Float, nullable=True)
    stock = db.Column(db.Integer, default=0)
    image_url = db.Column(db.String(200))

class Sale(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    total = db.Column(db.Float, nullable=False)
    items = db.Column(db.Text, nullable=False)

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
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
def add_product():
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
def update_product(id):
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
def delete_product(id):
    p = Product.query.get_or_404(id)
    db.session.delete(p)
    db.session.commit()
    return jsonify({'message': 'Product deleted'})

@app.route('/api/products/search', methods=['GET'])
def search_products():
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
def record_sale():
    data = request.get_json()
    s = Sale(total=data['total'], items=data['items'])
    db.session.add(s)
    for item in data['cart']:
        product = Product.query.get(item['id'])
        if product and product.stock >= item['qty']:
            product.stock -= item['qty']
    db.session.commit()
    return jsonify({'message': 'Sale recorded'})

@app.route('/api/sales', methods=['GET'])
def get_sales():
    sales = Sale.query.order_by(Sale.date.desc()).all()
    return jsonify([{
        'id': s.id,
        'date': s.date.isoformat(),
        'total': s.total,
        'items': s.items
    } for s in sales])

@app.route('/api/sales/export', methods=['GET'])
def export_sales_csv():
    start_date = request.args.get('start')
    end_date = request.args.get('end')
    query = Sale.query
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

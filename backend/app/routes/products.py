from flask import Blueprint, request, jsonify
from ..models.product import Product, product_schema, products_schema
from .. import db

bp = Blueprint('products', __name__, url_prefix='/api/products')

@bp.route('/', methods=['GET'])
def get_products():
    """Получить все продукты"""
    products = Product.query.all()
    return jsonify(products_schema.dump(products))

@bp.route('/', methods=['POST'])
def create_product():
    """Создать новый продукт"""
    data = request.get_json()
    
    try:
        product = product_schema.load(data)
        db.session.add(product)
        db.session.commit()
        return jsonify(product_schema.dump(product)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>', methods=['GET'])
def get_product(id):
    """Получить продукт по ID"""
    product = Product.query.get_or_404(id)
    return jsonify(product_schema.dump(product))

@bp.route('/<int:id>', methods=['PUT'])
def update_product(id):
    """Обновить продукт"""
    product = Product.query.get_or_404(id)
    data = request.get_json()
    
    try:
        product = product_schema.load(data, instance=product, partial=True)
        db.session.commit()
        return jsonify(product_schema.dump(product))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'])
def delete_product(id):
    """Удалить продукт"""
    product = Product.query.get_or_404(id)
    db.session.delete(product)
    db.session.commit()
    return '', 204

@bp.route('/categories', methods=['GET'])
def get_categories():
    """Получить список всех категорий"""
    categories = db.session.query(Product.category).distinct().all()
    return jsonify([category[0] for category in categories if category[0]]) 
from flask import Blueprint, request, jsonify
from ..models.order import Order, order_schema, orders_schema
from ..models.product import Product, product_schema
from ..models.region import Region, region_schema
from .. import db
import pandas as pd
from datetime import datetime

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

@bp.route('/', methods=['GET'])
def get_orders():
    """Получить все заказы с возможностью фильтрации"""
    # Получение параметров фильтрации
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    region_id = request.args.get('region_id')
    product_id = request.args.get('product_id')
    
    query = Order.query
    
    if start_date:
        query = query.filter(Order.order_date >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Order.order_date <= datetime.strptime(end_date, '%Y-%m-%d'))
    if region_id:
        query = query.filter(Order.region_id == region_id)
    if product_id:
        query = query.filter(Order.product_id == product_id)
    
    orders = query.all()
    return jsonify(orders_schema.dump(orders))

@bp.route('/', methods=['POST'])
def create_order():
    """Создать новый заказ"""
    data = request.get_json()
    
    try:
        order = order_schema.load(data)
        db.session.add(order)
        db.session.commit()
        return jsonify(order_schema.dump(order)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>', methods=['GET'])
def get_order(id):
    """Получить заказ по ID"""
    order = Order.query.get_or_404(id)
    return jsonify(order_schema.dump(order))

@bp.route('/<int:id>', methods=['PUT'])
def update_order(id):
    """Обновить заказ"""
    order = Order.query.get_or_404(id)
    data = request.get_json()
    
    try:
        order = order_schema.load(data, instance=order, partial=True)
        db.session.commit()
        return jsonify(order_schema.dump(order))
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/<int:id>', methods=['DELETE'])
def delete_order(id):
    """Удалить заказ"""
    order = Order.query.get_or_404(id)
    db.session.delete(order)
    db.session.commit()
    return '', 204

@bp.route('/import', methods=['POST'])
def import_orders():
    """Импорт заказов из CSV/Excel файла"""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
        
    try:
        # Определение формата файла
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400
            
        # Обработка данных
        success_count = 0
        errors = []
        
        for _, row in df.iterrows():
            try:
                order_data = {
                    "order_id": str(row.get('order_id')),
                    "order_date": pd.to_datetime(row.get('order_date')).strftime('%Y-%m-%d %H:%M:%S'),
                    "ship_date": pd.to_datetime(row.get('ship_date')).strftime('%Y-%m-%d %H:%M:%S') if pd.notna(row.get('ship_date')) else None,
                    "ship_mode": row.get('ship_mode'),
                    "customer_id": str(row.get('customer_id')),
                    "customer_name": row.get('customer_name'),
                    "segment": row.get('segment'),
                    "country": row.get('country'),
                    "city": row.get('city'),
                    "state": row.get('state'),
                    "postal_code": str(row.get('postal_code')),
                    "region_id": row.get('region_id'),
                    "product_id": row.get('product_id'),
                    "quantity": int(row.get('quantity')),
                    "sales": float(row.get('sales')),
                    "discount": float(row.get('discount')) if pd.notna(row.get('discount')) else None,
                    "profit": float(row.get('profit')) if pd.notna(row.get('profit')) else None
                }
                
                order = order_schema.load(order_data)
                db.session.add(order)
                success_count += 1
            except Exception as e:
                errors.append(f"Error in row {success_count + 1}: {str(e)}")
                
        db.session.commit()
        
        return jsonify({
            "message": f"Successfully imported {success_count} orders",
            "errors": errors
        }), 201 if success_count > 0 else 400
        
    except Exception as e:
        return jsonify({"error": f"Error processing file: {str(e)}"}), 400 
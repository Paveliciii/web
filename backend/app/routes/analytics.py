from flask import Blueprint, request, jsonify
from sqlalchemy import func, desc
from ..models.order import Order
from ..models.product import Product
from ..models.region import Region
from datetime import datetime, timedelta

bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@bp.route('/summary', methods=['GET'])
def get_summary():
    """Получить общую сводку по продажам"""
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Order.query
    
    if start_date:
        query = query.filter(Order.order_date >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Order.order_date <= datetime.strptime(end_date, '%Y-%m-%d'))
    
    summary = {
        "total_orders": query.count(),
        "total_sales": float(query.with_entities(func.sum(Order.sales)).scalar() or 0),
        "total_profit": float(query.with_entities(func.sum(Order.profit)).scalar() or 0),
        "total_quantity": int(query.with_entities(func.sum(Order.quantity)).scalar() or 0),
        "average_order_value": float(query.with_entities(func.avg(Order.sales)).scalar() or 0)
    }
    
    return jsonify(summary)

@bp.route('/sales-by-region', methods=['GET'])
def get_sales_by_region():
    """Получить статистику продаж по регионам"""
    sales_by_region = db.session.query(
        Region.region_name,
        func.count(Order.id).label('total_orders'),
        func.sum(Order.sales).label('total_sales'),
        func.sum(Order.profit).label('total_profit')
    ).join(Order).group_by(Region.id).all()
    
    result = [{
        "region": region,
        "total_orders": int(orders),
        "total_sales": float(sales),
        "total_profit": float(profit)
    } for region, orders, sales, profit in sales_by_region]
    
    return jsonify(result)

@bp.route('/sales-by-product', methods=['GET'])
def get_sales_by_product():
    """Получить статистику продаж по продуктам"""
    sales_by_product = db.session.query(
        Product.product_name,
        Product.category,
        func.count(Order.id).label('total_orders'),
        func.sum(Order.quantity).label('total_quantity'),
        func.sum(Order.sales).label('total_sales'),
        func.sum(Order.profit).label('total_profit')
    ).join(Order).group_by(Product.id).all()
    
    result = [{
        "product": product,
        "category": category,
        "total_orders": int(orders),
        "total_quantity": int(quantity),
        "total_sales": float(sales),
        "total_profit": float(profit)
    } for product, category, orders, quantity, sales, profit in sales_by_product]
    
    return jsonify(result)

@bp.route('/sales-trend', methods=['GET'])
def get_sales_trend():
    """Получить тренд продаж по времени"""
    period = request.args.get('period', 'daily')  # daily, weekly, monthly
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = db.session.query(
        func.date(Order.order_date).label('date'),
        func.sum(Order.sales).label('total_sales'),
        func.sum(Order.profit).label('total_profit'),
        func.count(Order.id).label('total_orders')
    )
    
    if start_date:
        query = query.filter(Order.order_date >= datetime.strptime(start_date, '%Y-%m-%d'))
    if end_date:
        query = query.filter(Order.order_date <= datetime.strptime(end_date, '%Y-%m-%d'))
    
    if period == 'weekly':
        query = query.group_by(func.strftime('%Y-%W', Order.order_date))
    elif period == 'monthly':
        query = query.group_by(func.strftime('%Y-%m', Order.order_date))
    else:  # daily
        query = query.group_by(func.date(Order.order_date))
    
    trend_data = query.order_by('date').all()
    
    result = [{
        "date": date.strftime('%Y-%m-%d'),
        "total_sales": float(sales),
        "total_profit": float(profit),
        "total_orders": int(orders)
    } for date, sales, profit, orders in trend_data]
    
    return jsonify(result)

@bp.route('/top-products', methods=['GET'])
def get_top_products():
    """Получить топ продуктов по продажам"""
    limit = request.args.get('limit', 10, type=int)
    
    top_products = db.session.query(
        Product.product_name,
        Product.category,
        func.sum(Order.sales).label('total_sales'),
        func.sum(Order.quantity).label('total_quantity'),
        func.sum(Order.profit).label('total_profit')
    ).join(Order).group_by(Product.id).order_by(desc('total_sales')).limit(limit).all()
    
    result = [{
        "product": product,
        "category": category,
        "total_sales": float(sales),
        "total_quantity": int(quantity),
        "total_profit": float(profit)
    } for product, category, sales, quantity, profit in top_products]
    
    return jsonify(result)

@bp.route('/customer-segments', methods=['GET'])
def get_customer_segments():
    """Получить анализ по сегментам клиентов"""
    segments = db.session.query(
        Order.segment,
        func.count(distinct(Order.customer_id)).label('total_customers'),
        func.count(Order.id).label('total_orders'),
        func.sum(Order.sales).label('total_sales'),
        func.sum(Order.profit).label('total_profit')
    ).group_by(Order.segment).all()
    
    result = [{
        "segment": segment,
        "total_customers": int(customers),
        "total_orders": int(orders),
        "total_sales": float(sales),
        "total_profit": float(profit)
    } for segment, customers, orders, sales, profit in segments]
    
    return jsonify(result) 
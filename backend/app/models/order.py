from datetime import datetime
from .. import db, ma

class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(50), unique=True, nullable=False)
    order_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    ship_date = db.Column(db.DateTime)
    ship_mode = db.Column(db.String(50))
    customer_id = db.Column(db.String(50))
    customer_name = db.Column(db.String(100))
    segment = db.Column(db.String(50))
    country = db.Column(db.String(50))
    city = db.Column(db.String(50))
    state = db.Column(db.String(50))
    postal_code = db.Column(db.String(20))
    region_id = db.Column(db.Integer, db.ForeignKey('regions.id'))
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    quantity = db.Column(db.Integer, nullable=False)
    sales = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float)
    profit = db.Column(db.Float)
    
    # Отношения
    region = db.relationship('Region', backref='orders')
    product = db.relationship('Product', backref='orders')

class OrderSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Order
        include_fk = True
        load_instance = True

order_schema = OrderSchema()
orders_schema = OrderSchema(many=True) 
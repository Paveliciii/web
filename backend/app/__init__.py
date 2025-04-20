from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
import os

db = SQLAlchemy()
ma = Marshmallow()

def create_app():
    app = Flask(__name__)
    
    # Конфигурация базы данных
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.instance_path, 'sales.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Инициализация расширений
    CORS(app)
    db.init_app(app)
    ma.init_app(app)
    
    with app.app_context():
        # Импорт моделей
        from .models import order, product, region
        
        # Создание таблиц
        db.create_all()
        
        # Регистрация маршрутов
        from .routes import orders, analytics, products
        app.register_blueprint(orders.bp)
        app.register_blueprint(analytics.bp)
        app.register_blueprint(products.bp)
        
        return app 
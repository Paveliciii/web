from .. import db, ma

class Region(db.Model):
    __tablename__ = 'regions'
    
    id = db.Column(db.Integer, primary_key=True)
    region_name = db.Column(db.String(50), unique=True, nullable=False)
    country = db.Column(db.String(50))
    
class RegionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Region
        load_instance = True

region_schema = RegionSchema()
regions_schema = RegionSchema(many=True) 
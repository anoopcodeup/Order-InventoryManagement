from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app import models, schemas

class DuplicateSKUException(ValueError):
    pass

class DuplicateEmailException(ValueError):
    pass

class InsufficientStockException(ValueError):
    pass

class EntityNotFoundException(ValueError):
    pass

class ForeignKeyViolationException(ValueError):
    pass


def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()

def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def create_product(db: Session, product: schemas.ProductCreate):
    existing = get_product_by_sku(db, sku=product.sku)
    if existing:
        raise DuplicateSKUException(f"Product SKU '{product.sku}' is already in use.")
    
    db_product = models.Product(
        name=product.name,
        sku=product.sku,
        price=product.price,
        quantity_in_stock=product.quantity_in_stock
    )
    db.add(db_product)
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise e

def update_product(db: Session, product_id: int, product_update: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    if not db_product:
        raise EntityNotFoundException(f"Product with ID {product_id} does not exist.")
    
    update_data = product_update.model_dump(exclude_unset=True)
    if "sku" in update_data and update_data["sku"] != db_product.sku:
        existing = get_product_by_sku(db, sku=update_data["sku"])
        if existing:
            raise DuplicateSKUException(f"Product SKU '{update_data['sku']}' is already in use.")
            
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    try:
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise e

def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    if not db_product:
        raise EntityNotFoundException(f"Product with ID {product_id} does not exist.")
    db.delete(db_product)
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        raise ForeignKeyViolationException(
            f"Cannot delete product '{db_product.name}' because it is referenced in past orders."
        )
    except Exception as e:
        db.rollback()
        raise e


def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()

def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()

def get_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()

def create_customer(db: Session, customer: schemas.CustomerCreate):
    existing = get_customer_by_email(db, email=customer.email)
    if existing:
        raise DuplicateEmailException(f"Customer email '{customer.email}' is already in use.")
    
    db_customer = models.Customer(
        full_name=customer.full_name,
        email=customer.email,
        phone_number=customer.phone_number
    )
    db.add(db_customer)
    try:
        db.commit()
        db.refresh(db_customer)
        return db_customer
    except Exception as e:
        db.rollback()
        raise e

def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if not db_customer:
        raise EntityNotFoundException(f"Customer with ID {customer_id} does not exist.")
    db.delete(db_customer)
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        raise ForeignKeyViolationException(
            f"Cannot delete customer '{db_customer.full_name}' because they have existing orders."
        )
    except Exception as e:
        db.rollback()
        raise e


def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()

def get_orders(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Order).offset(skip).limit(limit).all()

def create_order(db: Session, order_in: schemas.OrderCreate):
    customer = get_customer(db, customer_id=order_in.customer_id)
    if not customer:
        raise EntityNotFoundException(f"Customer with ID {order_in.customer_id} does not exist.")
    
    grouped_quantities = {}
    for item in order_in.items:
        if item.product_id in grouped_quantities:
            grouped_quantities[item.product_id] += item.quantity
        else:
            grouped_quantities[item.product_id] = item.quantity
            
    db_order = models.Order(customer_id=order_in.customer_id, total_amount=0.00)
    db.add(db_order)
    
    try:
        db.flush()
        total_amount = 0
        
        for product_id, quantity in grouped_quantities.items():
            product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
            if not product:
                raise EntityNotFoundException(f"Product with ID {product_id} does not exist.")
            
            if product.quantity_in_stock < quantity:
                raise InsufficientStockException(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {quantity}, Available: {product.quantity_in_stock}."
                )
            
            product.quantity_in_stock -= quantity
            item_price = product.price
            total_amount += item_price * quantity
            
            db_item = models.OrderItem(
                order_id=db_order.id,
                product_id=product_id,
                quantity=quantity,
                unit_price=item_price
            )
            db.add(db_item)
            
        db_order.total_amount = total_amount
        db.commit()
        db.refresh(db_order)
        return db_order
        
    except Exception as e:
        db.rollback()
        raise e

def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    if not db_order:
        raise EntityNotFoundException(f"Order with ID {order_id} does not exist.")
    
    try:
        for item in db_order.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).with_for_update().first()
            if product:
                product.quantity_in_stock += item.quantity
                
        db.delete(db_order)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        raise e

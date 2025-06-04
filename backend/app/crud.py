from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from . import models, schemas, auth
from .auth import get_password_hash
from datetime import datetime
from typing import List, Optional


def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=user.is_active,
        is_admin=user.is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not auth.verify_password(password, user.hashed_password):
        return False
    return user


def get_stock(db: Session, stock_id: int):
    return db.query(models.Stock).filter(models.Stock.id == stock_id).first()


def get_stock_by_symbol(db: Session, symbol: str):
    return db.query(models.Stock).filter(models.Stock.symbol == symbol).first()


def get_stocks(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Stock).offset(skip).limit(limit).all()


def create_stock(db: Session, stock: schemas.StockCreate):
    db_stock = models.Stock(**stock.model_dump())
    db.add(db_stock)
    db.commit()
    db.refresh(db_stock)
    return db_stock


def update_stock(db: Session, stock_id: int, stock: schemas.StockCreate):
    db_stock = get_stock(db, stock_id)
    if db_stock:
        for key, value in stock.model_dump().items():
            setattr(db_stock, key, value)
        db.commit()
        db.refresh(db_stock)
    return db_stock


def delete_stock(db: Session, stock_id: int):
    db_stock = get_stock(db, stock_id)
    if db_stock:
        db.delete(db_stock)
        db.commit()
    return db_stock


def delete_user(db: Session, user_id: int):
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return db_user
    return None


# Customer CRUD operations
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()


def get_customers(db: Session, skip: int = 0, limit: int = 100, search: str = None):
    query = db.query(models.Customer)

    if search:
        search = f"%{search}%"
        query = query.filter(
            or_(
                models.Customer.name.ilike(search),
                models.Customer.email.ilike(search),
                models.Customer.phone.ilike(search)
            )
        )

    return query.offset(skip).limit(limit).all()


def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def update_customer(db: Session, customer_id: int, customer: schemas.CustomerCreate):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        for key, value in customer.model_dump().items():
            setattr(db_customer, key, value)
        db.commit()
        db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    if db_customer:
        db.delete(db_customer)
        db.commit()
    return db_customer


# Item CRUD operations
def get_item(db: Session, item_id: int):
    return db.query(models.Item).filter(models.Item.id == item_id).first()


def get_items(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Item).offset(skip).limit(limit).all()


def create_item(db: Session, item: schemas.ItemCreate):
    db_item = models.Item(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def update_item(db: Session, item_id: int, item: schemas.ItemCreate):
    db_item = get_item(db, item_id)
    if db_item:
        for key, value in item.model_dump().items():
            setattr(db_item, key, value)
        db.commit()
        db.refresh(db_item)
    return db_item


def delete_item(db: Session, item_id: int):
    db_item = get_item(db, item_id)
    if db_item:
        db.delete(db_item)
        db.commit()
    return db_item


# Sale CRUD operations
def get_sale(db: Session, sale_id: int):
    return db.query(models.Sale).options(
        joinedload(models.Sale.customer)
    ).filter(models.Sale.id == sale_id).first()


def get_sales(db: Session, skip: int = 0, limit: int = 100):
    try:
        # Verificar el total de ventas en la base de datos
        total_sales = db.query(models.Sale).count()
        print(f"\nTotal sales in database: {total_sales}")

        if total_sales == 0:
            print("No sales found in database")
            return []

        # Obtener las ventas con todas las relaciones necesarias
        query = (
            db.query(models.Sale)
            .options(
                joinedload(models.Sale.customer),
                joinedload(models.Sale.user),
                joinedload(models.Sale.items).joinedload(models.SaleItem.item)
            )
            .order_by(models.Sale.created_at.desc())
            .offset(skip)
            .limit(limit)
        )

        # Imprimir la consulta SQL
        print(
            f"\nSQL Query: {query.statement.compile(compile_kwargs={'literal_binds': True})}")

        # Ejecutar la consulta
        sales = query.all()
        print(f"\nRetrieved {len(sales)} sales from database")

        # Procesar cada venta
        valid_sales = []
        for sale in sales:
            print(f"\nProcessing sale ID: {sale.id}")
            print(
                f"Customer: {sale.customer.name if sale.customer else 'No customer'}")
            print(f"User: {sale.user.username if sale.user else 'No user'}")
            print(f"Items count: {len(sale.items)}")
            print(f"Total amount: {sale.total_amount}")
            print(f"Created at: {sale.created_at}")

            # Filtrar items inválidos
            valid_items = [
                item for item in sale.items if item.item is not None]
            if len(valid_items) != len(sale.items):
                print(
                    f"Filtered out {len(sale.items) - len(valid_items)} invalid items")
                sale.items = valid_items

            valid_sales.append(sale)
            print(f"Added sale {sale.id} to valid sales")

        print(f"\nReturning {len(valid_sales)} valid sales")
        return valid_sales

    except Exception as e:
        print(f"Error in get_sales: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return []


def create_sale(db: Session, sale: schemas.SaleCreate, user_id: int = None):
    try:
        # Create the sale
        db_sale = models.Sale(
            customer_id=sale.customer_id,
            user_id=user_id,
            total_amount=sale.total_amount
        )
        db.add(db_sale)
        db.flush()  # Get the sale ID without committing

        # Create sale items and update stock in a single transaction
        for item in sale.items:
            db_item = get_item(db, item.item_id)
            if not db_item:
                raise ValueError(
                    f"Producto con ID {item.item_id} no encontrado")

            # Create sale item
            db_sale_item = models.SaleItem(
                sale_id=db_sale.id,
                item_id=item.item_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.quantity * item.unit_price
            )
            db.add(db_sale_item)

            # Update item stock
            db_item.stock -= item.quantity
            db.add(db_item)

        db.commit()
        db.refresh(db_sale)
        return db_sale
    except Exception as e:
        db.rollback()
        raise e


def delete_sale(db: Session, sale_id: int):
    db_sale = get_sale(db, sale_id)
    if db_sale:
        try:
            # Restore item stock
            for sale_item in db_sale.items:
                db_item = get_item(db, sale_item.item_id)
                if db_item:
                    db_item.stock += sale_item.quantity
                    db.add(db_item)

            # Delete the sale (this will cascade delete the sale items)
            db.delete(db_sale)
            db.commit()
            return db_sale
        except Exception as e:
            db.rollback()
            raise e
    return None


def update_sale(db: Session, sale_id: int, sale: schemas.SaleUpdate):
    db_sale = get_sale(db, sale_id)
    if not db_sale:
        return None

    try:
        # Restaurar el stock original de los items actuales
        for sale_item in db_sale.items:
            db_item = get_item(db, sale_item.item_id)
            if db_item:
                db_item.stock += sale_item.quantity
                db.add(db_item)

        # Actualizar los items de la venta
        for item in sale.items:
            db_item = get_item(db, item.item_id)
            if not db_item:
                raise ValueError(f"Item with id {item.item_id} not found")

            # Verificar stock suficiente
            if db_item.stock < item.quantity:
                raise ValueError(f"Not enough stock for item {db_item.name}")

            # Actualizar el stock
            db_item.stock -= item.quantity
            db.add(db_item)

            # Actualizar o crear el item de la venta
            existing_item = next(
                (si for si in db_sale.items if si.item_id == item.item_id), None)
            if existing_item:
                existing_item.quantity = item.quantity
                existing_item.unit_price = item.unit_price
                existing_item.subtotal = item.quantity * item.unit_price
            else:
                new_sale_item = models.SaleItem(
                    sale_id=db_sale.id,
                    item_id=item.item_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.quantity * item.unit_price
                )
                db.add(new_sale_item)

        # Actualizar el monto total
        db_sale.total_amount = sale.total_amount
        db.commit()
        db.refresh(db_sale)
        return db_sale

    except Exception as e:
        db.rollback()
        raise e


def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    db_user = get_user(db, user_id)
    if db_user:
        user_data = user.model_dump(exclude_unset=True)
        if 'password' in user_data and user_data['password']:
            db_user.hashed_password = get_password_hash(user_data['password'])
            user_data.pop('password')
        for key, value in user_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def get_stock_updates(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.StockUpdate).options(
        joinedload(models.StockUpdate.item)
    ).order_by(models.StockUpdate.created_at.desc()).offset(skip).limit(limit).all()


def create_stock_update(db: Session, stock_update: schemas.StockUpdateCreate):
    # Get the item
    item = get_item(db, stock_update.item_id)
    if not item:
        return None

    # Update the item's stock
    item.stock += stock_update.quantity

    # Create the stock update record
    db_stock_update = models.StockUpdate(**stock_update.model_dump())
    db.add(db_stock_update)
    db.commit()
    db.refresh(db_stock_update)
    return db_stock_update

from datetime import datetime, timedelta
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging
import traceback
from sqlalchemy import func, or_
import os
from dotenv import load_dotenv

from . import crud, models, schemas, auth, dummy_data
from .database import engine, get_db, SessionLocal
from .auth import get_current_active_user, get_current_admin_user, get_current_user

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Configuración de JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración de CORS
origins = [
    "http://localhost:5173",  # Frontend development server
    "http://localhost:3000",  # Alternative frontend port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app = FastAPI(
    title="Stock App API",
    description="API for managing stock portfolio and market data",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Use auth module's configuration
oauth2_scheme = auth.oauth2_scheme
pwd_context = auth.pwd_context

# Create default admin user if not exists


def create_default_admin():
    db = SessionLocal()
    try:
        admin = crud.get_user_by_username(db, "admin")
        if not admin:
            crud.create_user(
                db,
                schemas.UserCreate(
                    username="admin",
                    password="admin",
                    email="admin@example.com",
                    is_admin=True
                )
            )
    finally:
        db.close()


create_default_admin()


@app.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    try:
        user = crud.authenticate_user(
            db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario desactivado. Por favor contacte al administrador.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token = auth.create_access_token(data={"sub": user.username})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    except Exception as e:
        logger.error(f"Error en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error al iniciar sesión. Por favor, verifica tus credenciales.",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/")
async def root():
    return JSONResponse(
        content={"message": "Welcome to Stock App API"},
        status_code=200
    )


@app.post("/stocks/", response_model=schemas.Stock)
def create_stock(
    stock: schemas.StockCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_stock = crud.get_stock_by_symbol(db, symbol=stock.symbol)
    if db_stock:
        raise HTTPException(
            status_code=400,
            detail="Stock symbol already registered"
        )
    return crud.create_stock(db=db, stock=stock)


@app.get("/stocks/", response_model=List[schemas.Stock])
def read_stocks(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    stocks = crud.get_stocks(db, skip=skip, limit=limit)
    return stocks


@app.get("/stocks/{stock_id}", response_model=schemas.Stock)
def read_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_stock = crud.get_stock(db, stock_id=stock_id)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@app.put("/stocks/{stock_id}", response_model=schemas.Stock)
def update_stock(
    stock_id: int,
    stock: schemas.StockCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_stock = crud.update_stock(db, stock_id=stock_id, stock=stock)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@app.delete("/stocks/{stock_id}", response_model=schemas.Stock)
def delete_stock(
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_stock = crud.delete_stock(db, stock_id=stock_id)
    if db_stock is None:
        raise HTTPException(status_code=404, detail="Stock not found")
    return db_stock


@app.get("/users/me", response_model=schemas.User)
async def read_users_me(
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return current_user


@app.get("/users/", response_model=List[schemas.User])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    users = crud.get_users(db, skip=skip, limit=limit)
    return users


@app.post("/users/", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=400, detail="Username already registered")

    return crud.create_user(db=db, user=user)


@app.get("/users/{user_id}", response_model=schemas.User)
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@app.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Verificar si el nuevo username ya existe
    if user.username and user.username != db_user.username:
        existing_user = crud.get_user_by_username(db, username=user.username)
        if existing_user:
            raise HTTPException(
                status_code=400, detail="Username already registered")

    return crud.update_user(db=db, user_id=user_id, user=user)


@app.delete("/users/{user_id}", response_model=schemas.User)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin_user)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.delete_user(db=db, user_id=user_id)


@app.post("/customers/", response_model=schemas.Customer)
def create_customer(
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_customer = crud.get_customer_by_email(db, email=customer.email)
    if db_customer:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return crud.create_customer(db=db, customer=customer)


@app.get("/customers/", response_model=List[schemas.Customer])
def read_customers(
    skip: int = 0,
    limit: int = 100,
    search: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    customers = crud.get_customers(db, skip=skip, limit=limit, search=search)
    return customers


@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_customer = crud.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@app.put("/customers/{customer_id}", response_model=schemas.Customer)
def update_customer(
    customer_id: int,
    customer: schemas.CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_customer = crud.update_customer(db, customer_id, customer)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@app.delete("/customers/{customer_id}", response_model=schemas.Customer)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_customer = crud.delete_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return db_customer


@app.post("/items/", response_model=schemas.Item)
def create_item(
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    return crud.create_item(db=db, item=item)


@app.get("/items/", response_model=List[schemas.Item])
def read_items(
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    sort_by: str = None,
    sort_order: str = "asc",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        query = db.query(models.Item)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    models.Item.name.ilike(search_term),
                    models.Item.description.ilike(search_term)
                )
            )

        # Apply sorting if sort_by is provided
        if sort_by:
            column = getattr(models.Item, sort_by, None)
            if column is not None:
                if sort_order == "desc":
                    query = query.order_by(column.desc())
                else:
                    query = query.order_by(column.asc())

        items = query.offset(skip).limit(limit).all()
        return items
    except Exception as e:
        logger.error(f"Error al obtener items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener items: {str(e)}"
        )


@app.get("/items/low-stock", response_model=List[schemas.Item])
def get_low_stock_items(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    """Obtener items con stock bajo (menos de 3 unidades)"""
    try:
        logger.info("Obteniendo items con stock bajo...")
        # Query directa para obtener items con stock bajo
        low_stock_items = db.query(models.Item).filter(
            models.Item.stock < 3).all()
        logger.info(
            f"Items con stock bajo encontrados: {len(low_stock_items)}")
        for item in low_stock_items:
            logger.info(f"Item: {item.name}, Stock: {item.stock}")

        return low_stock_items
    except Exception as e:
        logger.error(f"Error al obtener items con stock bajo: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Error al obtener items con stock bajo"
        )


@app.get("/items/{item_id}", response_model=schemas.Item)
def read_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item


@app.put("/items/{item_id}", response_model=schemas.Item)
def update_item(
    item_id: int,
    item: schemas.ItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_item = crud.update_item(db, item_id, item)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item


@app.delete("/items/{item_id}", response_model=schemas.Item)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_item = crud.delete_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_item


@app.get("/sales/", response_model=List[schemas.Sale])
def get_sales(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logger.info("="*50)
    logger.info("Fetching sales...")
    try:
        sales = crud.get_sales(db, skip=skip, limit=limit)
        logger.info(f"Found {len(sales)} sales")
        for sale in sales:
            logger.info(f"Sale ID: {sale.id}")
            logger.info(
                f"Customer: {sale.customer.name if sale.customer else 'No customer'}")
            logger.info(
                f"User: {sale.user.username if sale.user else 'No user'}")
            logger.info(f"Items: {len(sale.items)}")
            logger.info(f"Total: {sale.total_amount}")
            logger.info(f"Created at: {sale.created_at}")
            logger.info("-"*30)
        logger.info("="*50)
        return sales
    except Exception as e:
        logger.error(f"Error fetching sales: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/sales/", response_model=schemas.Sale)
def create_sale(
    sale: schemas.SaleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    logger.info("="*50)
    logger.info(f"Creating sale for customer ID: {sale.customer_id}")

    # Verificar que el cliente existe
    customer = crud.get_customer(db, sale.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    logger.info(f"Customer found: {customer.name}")

    # Validar stock antes de crear la venta
    for item_data in sale.items:
        item = crud.get_item(db, item_data.item_id)
        if not item:
            raise HTTPException(
                status_code=404, detail=f"Producto con ID {item_data.item_id} no encontrado")

        if item.stock < item_data.quantity:
            raise HTTPException(
                status_code=400, detail=f"Stock insuficiente para el producto {item.name}")

    # Crear la venta con el usuario actual
    db_sale = crud.create_sale(
        db, sale, current_user.id if current_user else None)
    logger.info(f"Sale created with ID: {db_sale.id}")
    logger.info("Sale created successfully")
    logger.info("="*50)
    return db_sale


@app.get("/sales/{sale_id}", response_model=schemas.Sale)
def read_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_sale = crud.get_sale(db, sale_id=sale_id)
    if db_sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return db_sale


@app.delete("/sales/{sale_id}", response_model=schemas.Sale)
def delete_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_sale = crud.delete_sale(db, sale_id=sale_id)
    if db_sale is None:
        raise HTTPException(status_code=404, detail="Sale not found")
    return db_sale


@app.put("/sales/{sale_id}", response_model=schemas.Sale)
def update_sale(
    sale_id: int,
    sale: schemas.SaleUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_sale = crud.update_sale(db, sale_id, sale)
        if db_sale is None:
            raise HTTPException(status_code=404, detail="Venta no encontrada")
        return db_sale
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/load-dummy-data/", response_model=dict)
def load_dummy_data(current_user: models.User = Depends(get_current_user)):
    """
    Carga datos de prueba en la base de datos.
    Solo accesible por usuarios administradores.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden cargar datos de prueba"
        )

    try:
        result = dummy_data.create_dummy_data()
        return result
    except Exception as e:
        logging.error(f"Error al cargar datos de prueba: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cargar datos de prueba: {str(e)}"
        )


@app.get("/stats/top-products", response_model=List[schemas.TopProduct])
def get_top_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        # Obtener los 3 productos más vendidos
        top_products = db.query(
            models.Item.id,
            models.Item.name,
            func.sum(models.SaleItem.quantity).label('total_quantity'),
            func.sum(models.SaleItem.quantity *
                     models.SaleItem.unit_price).label('total_amount')
        ).join(
            models.SaleItem,
            models.Item.id == models.SaleItem.item_id
        ).group_by(
            models.Item.id,
            models.Item.name
        ).order_by(
            func.sum(models.SaleItem.quantity).desc()
        ).limit(3).all()

        # Convertir los resultados a diccionarios
        result = [
            {
                "id": item.id,
                "name": item.name,
                "total_quantity": item.total_quantity,
                "total_amount": float(item.total_amount)
            }
            for item in top_products
        ]

        return result
    except Exception as e:
        logging.error(f"Error al obtener productos más vendidos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener productos más vendidos: {str(e)}"
        )


@app.get("/stats/monthly", response_model=schemas.MonthlyStats)
def get_monthly_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        # Obtener la fecha de hace un mes
        one_month_ago = datetime.now() - timedelta(days=30)

        # Obtener estadísticas del último mes
        monthly_stats = db.query(
            func.count(models.Sale.id).label('total_sales'),
            func.sum(models.Sale.total_amount).label('total_income')
        ).filter(
            models.Sale.created_at >= one_month_ago
        ).first()

        return {
            "total_sales": monthly_stats.total_sales or 0,
            "total_income": float(monthly_stats.total_income or 0)
        }
    except Exception as e:
        logging.error(f"Error al obtener estadísticas mensuales: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas mensuales: {str(e)}"
        )


@app.get("/stock-updates/", response_model=List[schemas.StockUpdate])
def read_stock_updates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    try:
        stock_updates = crud.get_stock_updates(db, skip=skip, limit=limit)
        return stock_updates
    except Exception as e:
        logger.error(f"Error getting stock updates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting stock updates: {str(e)}"
        )


@app.post("/stock-updates/", response_model=schemas.StockUpdate)
def create_stock_update(
    stock_update: schemas.StockUpdateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_active_user)
):
    db_stock_update = crud.create_stock_update(db, stock_update=stock_update)
    if db_stock_update is None:
        raise HTTPException(status_code=404, detail="Item not found")
    return db_stock_update


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

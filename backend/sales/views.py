from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from . import models, schemas
from ..items.models import Item
from ..customers.models import Customer
import logging

router = APIRouter()


@router.get("/sales/", response_model=List[schemas.Sale])
def get_sales(db: Session = Depends(get_db)):
    print("\n" + "="*50)
    print("GETTING SALES")
    sales = db.query(models.Sale).all()
    print(f"Found {len(sales)} sales")
    for sale in sales:
        print(
            f"Sale ID: {sale.id}, Customer: {sale.customer.name if sale.customer else 'No customer'}")
    print("="*50 + "\n")
    return sales


@router.post("/sales/", response_model=schemas.Sale)
def create_sale(sale: schemas.SaleCreate, db: Session = Depends(get_db)):
    print("\n" + "="*50)
    print(f"Creating sale for customer ID: {sale.customer_id}")

    # Verificar que el cliente existe
    customer = db.query(Customer).filter(
        Customer.id == sale.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    print(f"Customer found: {customer.name}")

    # Crear la venta
    db_sale = models.Sale(
        customer_id=sale.customer_id,
        total_amount=sale.total_amount
    )
    db.add(db_sale)
    db.flush()  # Para obtener el ID de la venta
    print(f"Sale created with ID: {db_sale.id}")

    # Procesar los items
    for item_data in sale.items:
        item = db.query(Item).filter(Item.id == item_data.item_id).first()
        if not item:
            db.rollback()
            raise HTTPException(
                status_code=404, detail=f"Producto con ID {item_data.item_id} no encontrado")

        if item.stock < item_data.quantity:
            db.rollback()
            raise HTTPException(
                status_code=400, detail=f"Stock insuficiente para el producto {item.name}")

        # Crear el item de la venta
        sale_item = models.SaleItem(
            sale_id=db_sale.id,
            item_id=item.id,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            subtotal=item_data.quantity * item_data.unit_price
        )
        db.add(sale_item)

        # Actualizar el stock
        item.stock -= item_data.quantity
        print(f"Updated stock for item {item.name}: {item.stock}")

    db.commit()
    db.refresh(db_sale)
    print("Sale created successfully")
    print("="*50 + "\n")
    return db_sale

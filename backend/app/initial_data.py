# Datos de ejemplo para ventas
sales_data = [
    {
        "customer_id": 1,
        "total_amount": 150.00,
        "items": [
            {"item_id": 1, "quantity": 2, "unit_price": 50.00, "subtotal": 100.00},
            {"item_id": 2, "quantity": 1, "unit_price": 50.00, "subtotal": 50.00}
        ]
    },
    {
        "customer_id": 2,
        "total_amount": 200.00,
        "items": [
            {"item_id": 3, "quantity": 1, "unit_price": 200.00, "subtotal": 200.00}
        ]
    },
    {
        "customer_id": 3,
        "total_amount": 75.00,
        "items": [
            {"item_id": 4, "quantity": 3, "unit_price": 25.00, "subtotal": 75.00}
        ]
    }
]


def load_initial_data(db: Session):
    # Cargar usuarios
    for user in users_data:
        db_user = models.User(**user)
        db.add(db_user)
    db.commit()

    # Cargar clientes
    for customer in customers_data:
        db_customer = models.Customer(**customer)
        db.add(db_customer)
    db.commit()

    # Cargar productos
    for item in items_data:
        db_item = models.Item(**item)
        db.add(db_item)
    db.commit()

    # Cargar ventas con sus items
    for sale in sales_data:
        # Crear la venta
        db_sale = models.Sale(
            customer_id=sale["customer_id"],
            total_amount=sale["total_amount"]
        )
        db.add(db_sale)
        db.commit()
        db.refresh(db_sale)

        # Crear los items de la venta
        for item in sale["items"]:
            db_sale_item = models.SaleItem(
                sale_id=db_sale.id,
                item_id=item["item_id"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                subtotal=item["subtotal"]
            )
            db.add(db_sale_item)
        db.commit()

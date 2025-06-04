from sqlalchemy.orm import Session
from . import models, schemas
from .auth import get_password_hash
from datetime import datetime, timedelta
import random
from .crud import create_user, create_customer, create_item, create_sale
from .schemas import UserCreate, CustomerCreate, ItemCreate, SaleCreate
from .database import SessionLocal, engine


def create_dummy_data():
    # Eliminar todas las tablas y recrearlas
    models.Base.metadata.drop_all(bind=engine)
    models.Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Crear usuarios
        users = [
            {
                "username": "admin",
                "password": "admin",
                "email": "admin@example.com",
                "is_admin": True
            },
            {
                "username": "vendedor1",
                "password": "vendedor1",
                "email": "vendedor1@example.com",
                "is_admin": False
            },
            {
                "username": "vendedor2",
                "password": "vendedor2",
                "email": "vendedor2@example.com",
                "is_admin": False
            },
            {
                "username": "supervisor",
                "password": "supervisor",
                "email": "supervisor@example.com",
                "is_admin": True
            },
            {
                "username": "vendedor3",
                "password": "vendedor3",
                "email": "vendedor3@example.com",
                "is_admin": False
            },
            {
                "username": "vendedor4",
                "password": "vendedor4",
                "email": "vendedor4@example.com",
                "is_admin": False
            }
        ]

        for user_data in users:
            user = models.User(
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash(user_data["password"]),
                is_admin=user_data["is_admin"]
            )
            db.add(user)
        db.commit()

        # Crear clientes
        customers = [
            {
                "name": "Juan Pérez",
                "email": "juan@example.com",
                "phone": "123456789",
                "address": "Calle Principal 123"
            },
            {
                "name": "María García",
                "email": "maria@example.com",
                "phone": "987654321",
                "address": "Avenida Central 456"
            },
            {
                "name": "Carlos López",
                "email": "carlos@example.com",
                "phone": "456789123",
                "address": "Plaza Mayor 789"
            },
            {
                "name": "Ana Martínez",
                "email": "ana@example.com",
                "phone": "789123456",
                "address": "Calle Secundaria 321"
            },
            {
                "name": "Roberto Sánchez",
                "email": "roberto@example.com",
                "phone": "321654987",
                "address": "Avenida Norte 654"
            },
            {
                "name": "Laura Torres",
                "email": "laura@example.com",
                "phone": "654987321",
                "address": "Calle Sur 987"
            },
            {
                "name": "Miguel Rodríguez",
                "email": "miguel@example.com",
                "phone": "987321654",
                "address": "Plaza Central 147"
            },
            {
                "name": "Sofía Díaz",
                "email": "sofia@example.com",
                "phone": "147258369",
                "address": "Avenida Este 258"
            },
            {
                "name": "Diego Fernández",
                "email": "diego@example.com",
                "phone": "258369147",
                "address": "Calle Oeste 369"
            },
            {
                "name": "Lucía Morales",
                "email": "lucia@example.com",
                "phone": "369147258",
                "address": "Avenida Sur 147"
            },
            {
                "name": "Pablo González",
                "email": "pablo@example.com",
                "phone": "147369258",
                "address": "Plaza Norte 258"
            },
            {
                "name": "Carmen Ruiz",
                "email": "carmen@example.com",
                "phone": "258147369",
                "address": "Calle Este 369"
            },
            {
                "name": "Javier Moreno",
                "email": "javier@example.com",
                "phone": "369258147",
                "address": "Avenida Oeste 147"
            },
            {
                "name": "Isabel Castro",
                "email": "isabel@example.com",
                "phone": "147258963",
                "address": "Plaza Sur 963"
            },
            {
                "name": "Fernando Vargas",
                "email": "fernando@example.com",
                "phone": "963147258",
                "address": "Calle Norte 147"
            },
            {
                "name": "Patricia Soto",
                "email": "patricia@example.com",
                "phone": "258963147",
                "address": "Avenida Este 963"
            },
            {
                "name": "Ricardo Mendez",
                "email": "ricardo@example.com",
                "phone": "147963258",
                "address": "Plaza Oeste 258"
            },
            {
                "name": "Elena Ríos",
                "email": "elena@example.com",
                "phone": "963258147",
                "address": "Calle Sur 258"
            },
            {
                "name": "Alberto Luna",
                "email": "alberto@example.com",
                "phone": "258147963",
                "address": "Avenida Norte 963"
            },
            {
                "name": "Mónica Vega",
                "email": "monica@example.com",
                "phone": "147963852",
                "address": "Plaza Este 852"
            },
            {
                "name": "Héctor Silva",
                "email": "hector@example.com",
                "phone": "852147963",
                "address": "Calle Oeste 147"
            },
            {
                "name": "Natalia Paredes",
                "email": "natalia@example.com",
                "phone": "963852147",
                "address": "Avenida Sur 852"
            },
            {
                "name": "Oscar Medina",
                "email": "oscar@example.com",
                "phone": "147852963",
                "address": "Plaza Norte 963"
            },
            {
                "name": "Verónica Rojas",
                "email": "veronica@example.com",
                "phone": "852963147",
                "address": "Calle Este 852"
            },
            {
                "name": "Raúl Ortega",
                "email": "raul@example.com",
                "phone": "963147852",
                "address": "Avenida Oeste 852"
            },
            {
                "name": "Diana Campos",
                "email": "diana@example.com",
                "phone": "147852369",
                "address": "Plaza Sur 369"
            },
            {
                "name": "Eduardo Ponce",
                "email": "eduardo@example.com",
                "phone": "369852147",
                "address": "Calle Norte 852"
            },
            {
                "name": "Gabriela Núñez",
                "email": "gabriela@example.com",
                "phone": "852369147",
                "address": "Avenida Este 369"
            },
            {
                "name": "Manuel Cortés",
                "email": "manuel@example.com",
                "phone": "147369852",
                "address": "Plaza Oeste 852"
            }
        ]

        for customer_data in customers:
            customer = models.Customer(**customer_data)
            db.add(customer)
        db.commit()

        # Crear productos
        products = [
            {
                "name": "Laptop HP",
                "description": "Laptop HP 15.6 pulgadas, 8GB RAM, 256GB SSD",
                "price": 899.99,
                "stock": 15
            },
            {
                "name": "Monitor Dell",
                "description": "Monitor Dell 24 pulgadas Full HD",
                "price": 249.99,
                "stock": 20
            },
            {
                "name": "Teclado Mecánico",
                "description": "Teclado mecánico RGB, switches blue",
                "price": 79.99,
                "stock": 30
            },
            {
                "name": "Mouse Gaming",
                "description": "Mouse gaming RGB, 16000 DPI",
                "price": 49.99,
                "stock": 25
            },
            {
                "name": "Auriculares Sony",
                "description": "Auriculares inalámbricos con cancelación de ruido",
                "price": 199.99,
                "stock": 10
            },
            {
                "name": "Disco Duro SSD",
                "description": "SSD 1TB SATA III",
                "price": 129.99,
                "stock": 40
            },
            {
                "name": "Memoria RAM",
                "description": "Memoria RAM DDR4 16GB",
                "price": 89.99,
                "stock": 35
            },
            {
                "name": "Webcam HD",
                "description": "Webcam 1080p con micrófono",
                "price": 59.99,
                "stock": 20
            },
            {
                "name": "Router WiFi",
                "description": "Router WiFi 6, doble banda",
                "price": 149.99,
                "stock": 15
            },
            {
                "name": "Impresora Láser",
                "description": "Impresora láser monocromática",
                "price": 299.99,
                "stock": 8
            },
            {
                "name": "Tablet Samsung",
                "description": "Tablet 10 pulgadas, 64GB",
                "price": 349.99,
                "stock": 12
            },
            {
                "name": "Smartwatch",
                "description": "Smartwatch con monitor cardíaco",
                "price": 199.99,
                "stock": 18
            },
            {
                "name": "Laptop Dell XPS",
                "description": "Laptop Dell XPS 13, 16GB RAM, 512GB SSD",
                "price": 1299.99,
                "stock": 10
            },
            {
                "name": "Monitor LG UltraWide",
                "description": "Monitor LG 34 pulgadas UltraWide",
                "price": 499.99,
                "stock": 15
            },
            {
                "name": "Teclado Logitech",
                "description": "Teclado Logitech MX Keys",
                "price": 99.99,
                "stock": 25
            },
            {
                "name": "Mouse Logitech MX",
                "description": "Mouse Logitech MX Master 3",
                "price": 79.99,
                "stock": 20
            },
            {
                "name": "Auriculares Bose",
                "description": "Auriculares Bose QC35 II",
                "price": 299.99,
                "stock": 12
            },
            {
                "name": "SSD Samsung",
                "description": "SSD Samsung 2TB NVMe",
                "price": 199.99,
                "stock": 30
            },
            {
                "name": "RAM Corsair",
                "description": "RAM Corsair 32GB DDR4",
                "price": 149.99,
                "stock": 25
            },
            {
                "name": "Webcam Logitech",
                "description": "Webcam Logitech 4K Pro",
                "price": 199.99,
                "stock": 15
            },
            {
                "name": "Router Asus",
                "description": "Router Asus WiFi 6E",
                "price": 299.99,
                "stock": 10
            },
            {
                "name": "Impresora HP",
                "description": "Impresora HP Color LaserJet",
                "price": 399.99,
                "stock": 8
            },
            {
                "name": "iPad Pro",
                "description": "iPad Pro 12.9 pulgadas, 256GB",
                "price": 999.99,
                "stock": 10
            },
            {
                "name": "Apple Watch",
                "description": "Apple Watch Series 7",
                "price": 399.99,
                "stock": 15
            }
        ]

        # Generar más productos variando los existentes
        base_products = products.copy()
        for i in range(128):  # Generar 128 productos más para llegar a 150
            base_product = random.choice(base_products)
            new_product = {
                "name": f"{base_product['name']} {chr(65 + (i % 26))}",
                "description": base_product["description"],
                "price": round(base_product["price"] * random.uniform(0.8, 1.2), 2),
                "stock": random.randint(5, 50)
            }
            products.append(new_product)

        for product_data in products:
            product = models.Item(**product_data)
            db.add(product)
        db.commit()

        # Crear ventas
        def create_random_sale():
            # Seleccionar cliente aleatorio
            customer = random.choice(db.query(models.Customer).all())
            # Seleccionar vendedor aleatorio
            user = random.choice(db.query(models.User).all())
            # Crear fecha aleatoria en los últimos 90 días
            created_at = datetime.now() - timedelta(days=random.randint(0, 90))

            # Seleccionar 1-5 productos aleatorios
            items = random.sample(
                db.query(models.Item).all(), random.randint(1, 5))
            sale_items = []
            total_amount = 0

            for item in items:
                quantity = random.randint(1, min(5, item.stock))
                unit_price = item.price
                subtotal = quantity * unit_price
                total_amount += subtotal

                sale_item = models.SaleItem(
                    item=item,
                    quantity=quantity,
                    unit_price=unit_price,
                    subtotal=subtotal
                )
                sale_items.append(sale_item)

            sale = models.Sale(
                customer=customer,
                user=user,
                items=sale_items,
                total_amount=total_amount,
                created_at=created_at,
                paid=False,
            )
            return sale

        # Crear 200 ventas aleatorias
        for _ in range(200):
            sale = create_random_sale()
            db.add(sale)
        db.commit()

        return {
            "message": "Datos de prueba creados exitosamente",
            "users": len(users),
            "customers": len(customers),
            "products": len(products),
            "sales": 200
        }

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

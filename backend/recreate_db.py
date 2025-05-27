from app.database import engine
from app.models import Base


def recreate_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Database recreated successfully!")


if __name__ == "__main__":
    recreate_database()

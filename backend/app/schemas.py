from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    is_active: bool = True
    is_admin: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class User(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserBase


class TokenData(BaseModel):
    username: Optional[str] = None


class StockBase(BaseModel):
    symbol: str
    company_name: str
    current_price: float


class StockCreate(StockBase):
    pass


class Stock(StockBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Customer schemas
class CustomerBase(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Item schemas
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int


class ItemCreate(ItemBase):
    pass


class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# SaleItem schemas
class SaleItemBase(BaseModel):
    item_id: int
    quantity: int
    unit_price: float


class SaleItemCreate(SaleItemBase):
    pass


class SaleItem(SaleItemBase):
    id: int
    subtotal: float
    item: Item

    class Config:
        from_attributes = True


# Sale schemas
class SaleBase(BaseModel):
    customer_id: int
    total_amount: float


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    total_amount: float
    items: List[SaleItemCreate]


class Sale(SaleBase):
    id: int
    created_at: datetime
    items: List[SaleItem]
    customer: Customer
    user: User

    class Config:
        from_attributes = True


class TopProduct(BaseModel):
    id: int
    name: str
    total_quantity: int
    total_amount: float

    class Config:
        from_attributes = True


class MonthlyStats(BaseModel):
    total_sales: int
    total_income: float

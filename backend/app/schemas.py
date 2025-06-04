from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    is_active: bool = True
    is_admin: bool = False


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class User(UserBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
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
    email: Optional[str] = None
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


# Payment schemas
class PaymentBase(BaseModel):
    customer_id: int
    sale_id: Optional[int] = None
    amount: float
    description: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class Payment(BaseModel):
    id: int
    amount: float
    payment_date: datetime
    description: Optional[str] = None

    class Config:
        from_attributes = True


# Sale schemas
class SaleBase(BaseModel):
    customer_id: int
    total_amount: float
    paid: bool = False


class SaleCreate(SaleBase):
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    total_amount: float
    items: List[SaleItemCreate]
    paid: bool = False


class Sale(SaleBase):
    id: int
    created_at: datetime
    items: List[SaleItem]
    customer: Customer
    user: User
    paid: bool
    payments: List[Payment]

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


class StockUpdateBase(BaseModel):
    item_id: int
    quantity: int


class StockUpdateCreate(StockUpdateBase):
    pass


class StockUpdate(StockUpdateBase):
    id: int
    created_at: datetime
    item: Item

    class Config:
        from_attributes = True


class TopDebtor(BaseModel):
    id: int
    name: str
    total_debt: float

    class Config:
        from_attributes = True


class ConfigurationBase(BaseModel):
    key: str
    value: str
    description: Optional[str] = None


class ConfigurationCreate(ConfigurationBase):
    pass


class Configuration(ConfigurationBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LowStockThreshold(BaseModel):
    threshold: int

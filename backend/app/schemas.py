from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Product Name")
    sku: str = Field(..., min_length=1, max_length=100, description="Stock Keeping Unit (Unique)")
    price: Decimal = Field(..., ge=0, description="Product Price")
    quantity_in_stock: int = Field(default=0, ge=0, description="Quantity in stock")

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[Decimal] = Field(None, ge=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)

class ProductOut(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255, description="Customer's Full Name")
    email: EmailStr = Field(..., description="Unique email address")
    phone_number: Optional[str] = Field(None, max_length=50, description="Optional phone number")

class CustomerCreate(CustomerBase):
    pass

class CustomerOut(CustomerBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    product_id: int = Field(..., description="Reference ID of the Product")
    quantity: int = Field(..., gt=0, description="Quantity of the Product ordered")

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    product_name: Optional[str] = None
    product_sku: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_id: int = Field(..., description="Reference ID of the Customer")
    items: List[OrderItemCreate] = Field(..., min_length=1, description="List of items in the order")

class OrderOut(BaseModel):
    id: int
    customer_id: int
    total_amount: Decimal
    created_at: datetime
    items: List[OrderItemOut]
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

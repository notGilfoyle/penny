import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict


class DebtCreate(BaseModel):
    name: str
    total_amount: Decimal
    opened_date: date


class DebtUpdate(BaseModel):
    name: str | None = None
    total_amount: Decimal | None = None
    is_active: bool | None = None


class DebtRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    total_amount: Decimal
    opened_date: date
    is_active: bool
    created_at: datetime
    remaining_amount: Decimal
    paid_amount: Decimal
    percent_paid: float

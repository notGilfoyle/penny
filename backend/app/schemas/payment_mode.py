import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PaymentModeCreate(BaseModel):
    name: str


class PaymentModeUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class PaymentModeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    is_active: bool
    created_at: datetime

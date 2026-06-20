import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.enums import CategoryKind


class CategoryCreate(BaseModel):
    name: str
    kind: CategoryKind


class CategoryUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    kind: CategoryKind
    is_active: bool
    created_at: datetime

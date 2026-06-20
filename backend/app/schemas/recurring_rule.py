import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.enums import Direction


class RecurringRuleCreate(BaseModel):
    name: str
    amount: Decimal
    direction: Direction
    category_id: uuid.UUID
    payment_mode_id: uuid.UUID | None = None
    day_of_month: int = Field(ge=1, le=31)
    start_date: date
    end_date: date | None = None


class RecurringRuleUpdate(BaseModel):
    name: str | None = None
    amount: Decimal | None = None
    category_id: uuid.UUID | None = None
    payment_mode_id: uuid.UUID | None = None
    day_of_month: int | None = Field(default=None, ge=1, le=31)
    end_date: date | None = None
    is_active: bool | None = None


class RecurringRuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    amount: Decimal
    direction: Direction
    category_id: uuid.UUID
    category_name: str
    payment_mode_id: uuid.UUID | None
    payment_mode_name: str | None
    day_of_month: int
    start_date: date
    end_date: date | None
    is_active: bool
    created_at: datetime

    @classmethod
    def from_orm_with_names(cls, rule: object) -> "RecurringRuleRead":
        from app.models.recurring_rule import RecurringRule
        r = rule  # type: ignore[assignment]
        assert isinstance(r, RecurringRule)
        return cls(
            id=r.id,
            name=r.name,
            amount=r.amount,
            direction=r.direction,
            category_id=r.category_id,
            category_name=r.category.name,
            payment_mode_id=r.payment_mode_id,
            payment_mode_name=r.payment_mode.name if r.payment_mode else None,
            day_of_month=r.day_of_month,
            start_date=r.start_date,
            end_date=r.end_date,
            is_active=r.is_active,
            created_at=r.created_at,
        )

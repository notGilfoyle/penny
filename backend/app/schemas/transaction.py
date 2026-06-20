import uuid
from datetime import date, datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.enums import Direction, TransactionSource


class TransactionCreate(BaseModel):
    txn_date: date
    amount: Decimal
    direction: Direction
    category_id: uuid.UUID
    payment_mode_id: uuid.UUID | None = None
    debt_id: uuid.UUID | None = None
    recurring_rule_id: uuid.UUID | None = None
    note: str | None = None
    source: TransactionSource = TransactionSource.manual


class TransactionUpdate(BaseModel):
    txn_date: date | None = None
    amount: Decimal | None = None
    category_id: uuid.UUID | None = None
    payment_mode_id: uuid.UUID | None = None
    debt_id: uuid.UUID | None = None
    note: str | None = None


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    txn_date: date
    amount: Decimal
    direction: Direction
    category_id: uuid.UUID
    category_name: str
    payment_mode_id: uuid.UUID | None
    payment_mode_name: str | None
    debt_id: uuid.UUID | None
    debt_name: str | None
    recurring_rule_id: uuid.UUID | None
    note: str | None
    source: TransactionSource
    created_at: datetime

    @classmethod
    def from_orm(cls, txn: object) -> "TransactionRead":
        from app.models.transaction import Transaction
        t = txn  # type: ignore[assignment]
        assert isinstance(t, Transaction)
        return cls(
            id=t.id,
            txn_date=t.txn_date,
            amount=t.amount,
            direction=t.direction,
            category_id=t.category_id,
            category_name=t.category.name,
            payment_mode_id=t.payment_mode_id,
            payment_mode_name=t.payment_mode.name if t.payment_mode else None,
            debt_id=t.debt_id,
            debt_name=t.debt.name if t.debt else None,
            recurring_rule_id=t.recurring_rule_id,
            note=t.note,
            source=t.source,
            created_at=t.created_at,
        )

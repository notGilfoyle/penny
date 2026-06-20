import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, Enum, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from app.enums import Direction, TransactionSource


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    txn_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    direction: Mapped[Direction] = mapped_column(Enum(Direction), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), nullable=False)
    payment_mode_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("payment_modes.id"), nullable=True)
    debt_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("debts.id"), nullable=True)
    recurring_rule_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("recurring_rules.id"), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    source: Mapped[TransactionSource] = mapped_column(Enum(TransactionSource), default=TransactionSource.manual, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category: Mapped["Category"] = relationship("Category", lazy="joined")  # type: ignore[name-defined]
    payment_mode: Mapped["PaymentMode | None"] = relationship("PaymentMode", lazy="joined")  # type: ignore[name-defined]
    debt: Mapped["Debt | None"] = relationship("Debt", lazy="joined")  # type: ignore[name-defined]

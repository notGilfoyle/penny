import uuid
from datetime import date, datetime
from decimal import Decimal
from sqlalchemy import String, Boolean, Numeric, Integer, Date, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base
from app.enums import Direction


class RecurringRule(Base):
    __tablename__ = "recurring_rules"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    direction: Mapped[Direction] = mapped_column(Enum(Direction), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("categories.id"), nullable=False)
    payment_mode_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("payment_modes.id"), nullable=True)
    day_of_month: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category: Mapped["Category"] = relationship("Category", lazy="joined")  # type: ignore[name-defined]
    payment_mode: Mapped["PaymentMode | None"] = relationship("PaymentMode", lazy="joined")  # type: ignore[name-defined]

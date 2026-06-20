import calendar
from datetime import date
from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import extract, select, func
from sqlalchemy.orm import Session
from app.db import get_db
from app.enums import Direction
from app.models.category import Category
from app.models.debt import Debt
from app.models.transaction import Transaction

router = APIRouter(prefix="/summary", tags=["summary"])


@router.get("/trend")
def get_trend(months: int = 12, db: Session = Depends(get_db)):
    """Return income/expense/savings totals for the last N calendar months."""
    today = date.today()

    # Compute start month
    start_month = today.month - months + 1
    start_year = today.year
    while start_month <= 0:
        start_month += 12
        start_year -= 1
    start = date(start_year, start_month, 1)
    end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])

    rows = db.execute(
        select(
            extract("year", Transaction.txn_date).label("yr"),
            extract("month", Transaction.txn_date).label("mo"),
            Transaction.direction,
            func.sum(Transaction.amount).label("total"),
        )
        .where(Transaction.txn_date >= start)
        .where(Transaction.txn_date <= end)
        .group_by("yr", "mo", Transaction.direction)
        .order_by("yr", "mo")
    ).all()

    # Index by (year, month, direction)
    data: dict[tuple[int, int, str], Decimal] = {}
    for row in rows:
        data[(int(row.yr), int(row.mo), row.direction.value)] = Decimal(str(row.total))

    # Build ordered list, filling zeros for empty months
    result = []
    y, m = start_year, start_month
    while (y, m) <= (today.year, today.month):
        income = data.get((y, m, "income"), Decimal("0"))
        expense = data.get((y, m, "expense"), Decimal("0"))
        savings = income - expense
        savings_rate = float(savings / income * 100) if income > 0 else 0.0
        result.append({
            "year": y,
            "month": m,
            "income_total": income,
            "expense_total": expense,
            "savings": savings,
            "savings_rate": round(savings_rate, 1),
        })
        m += 1
        if m > 12:
            m = 1
            y += 1

    return result


@router.get("/{year}/{month}")
def get_monthly_summary(year: int, month: int, db: Session = Depends(get_db)):
    start = date(year, month, 1)
    end = date(year, month, calendar.monthrange(year, month)[1])

    income_total = Decimal(str(
        db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.direction == Direction.income)
            .where(Transaction.txn_date >= start)
            .where(Transaction.txn_date <= end)
        ) or 0
    ))

    expense_total = Decimal(str(
        db.scalar(
            select(func.coalesce(func.sum(Transaction.amount), 0))
            .where(Transaction.direction == Direction.expense)
            .where(Transaction.txn_date >= start)
            .where(Transaction.txn_date <= end)
        ) or 0
    ))

    savings = income_total - expense_total
    savings_rate = float(savings / income_total * 100) if income_total > 0 else 0.0

    category_rows = db.execute(
        select(Category.id, Category.name, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .where(Transaction.direction == Direction.expense)
        .where(Transaction.txn_date >= start)
        .where(Transaction.txn_date <= end)
        .group_by(Category.id, Category.name)
        .order_by(func.sum(Transaction.amount).desc())
    ).all()

    expense_by_category = [
        {
            "category_id": str(row.id),
            "category_name": row.name,
            "amount": Decimal(str(row.total)),
            "percent": float(Decimal(str(row.total)) / expense_total * 100) if expense_total > 0 else 0.0,
        }
        for row in category_rows
    ]

    debts = db.execute(select(Debt).where(Debt.is_active == True)).scalars().all()  # noqa: E712
    debt_summary = []
    for debt in debts:
        paid = Decimal(str(
            db.scalar(
                select(func.coalesce(func.sum(Transaction.amount), 0))
                .where(Transaction.debt_id == debt.id)
            ) or 0
        ))
        remaining = max(Decimal("0"), debt.total_amount - paid)
        debt_summary.append({
            "debt_id": str(debt.id),
            "name": debt.name,
            "total_amount": debt.total_amount,
            "remaining_amount": remaining,
            "paid_amount": paid,
            "percent_paid": float(paid / debt.total_amount * 100) if debt.total_amount > 0 else 0.0,
        })

    return {
        "year": year,
        "month": month,
        "income_total": income_total,
        "expense_total": expense_total,
        "savings": savings,
        "savings_rate": round(savings_rate, 1),
        "expense_by_category": expense_by_category,
        "debt_summary": debt_summary,
    }

import uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.debt import Debt
from app.models.transaction import Transaction
from app.schemas.debt import DebtCreate, DebtUpdate, DebtRead

router = APIRouter(prefix="/debts", tags=["debts"])


def _enrich(debt: Debt, db: Session) -> DebtRead:
    paid = db.scalar(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(Transaction.debt_id == debt.id)
    ) or Decimal("0")
    paid = Decimal(str(paid))
    remaining = max(Decimal("0"), debt.total_amount - paid)
    pct = float(paid / debt.total_amount * 100) if debt.total_amount > 0 else 0.0
    return DebtRead(
        id=debt.id,
        name=debt.name,
        total_amount=debt.total_amount,
        opened_date=debt.opened_date,
        is_active=debt.is_active,
        created_at=debt.created_at,
        remaining_amount=remaining,
        paid_amount=paid,
        percent_paid=pct,
    )


@router.get("", response_model=list[DebtRead])
def list_debts(active_only: bool = True, db: Session = Depends(get_db)):
    q = select(Debt)
    if active_only:
        q = q.where(Debt.is_active == True)  # noqa: E712
    q = q.order_by(Debt.name)
    debts = db.execute(q).scalars().all()
    return [_enrich(d, db) for d in debts]


@router.post("", response_model=DebtRead, status_code=201)
def create_debt(body: DebtCreate, db: Session = Depends(get_db)):
    debt = Debt(**body.model_dump())
    db.add(debt)
    db.commit()
    db.refresh(debt)
    return _enrich(debt, db)


@router.get("/{debt_id}", response_model=DebtRead)
def get_debt(debt_id: uuid.UUID, db: Session = Depends(get_db)):
    debt = db.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    return _enrich(debt, db)


@router.put("/{debt_id}", response_model=DebtRead)
def update_debt(debt_id: uuid.UUID, body: DebtUpdate, db: Session = Depends(get_db)):
    debt = db.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(debt, field, value)
    db.commit()
    db.refresh(debt)
    return _enrich(debt, db)


@router.delete("/{debt_id}", status_code=204)
def archive_debt(debt_id: uuid.UUID, db: Session = Depends(get_db)):
    debt = db.get(Debt, debt_id)
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    debt.is_active = False
    db.commit()

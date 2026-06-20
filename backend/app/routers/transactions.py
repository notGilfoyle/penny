import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.enums import Direction
from app.models.transaction import Transaction
from app.models.debt import Debt
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionRead

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=list[TransactionRead])
def list_transactions(
    year: int | None = None,
    month: int | None = None,
    direction: Direction | None = None,
    category_id: uuid.UUID | None = None,
    debt_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    q = select(Transaction)
    if year and month:
        start = date(year, month, 1)
        import calendar
        end = date(year, month, calendar.monthrange(year, month)[1])
        q = q.where(Transaction.txn_date >= start).where(Transaction.txn_date <= end)
    if direction:
        q = q.where(Transaction.direction == direction)
    if category_id:
        q = q.where(Transaction.category_id == category_id)
    if debt_id:
        q = q.where(Transaction.debt_id == debt_id)
    q = q.order_by(Transaction.txn_date.desc(), Transaction.created_at.desc())
    txns = db.execute(q).scalars().all()
    return [TransactionRead.from_orm(t) for t in txns]


@router.post("", response_model=TransactionRead, status_code=201)
def create_transaction(body: TransactionCreate, db: Session = Depends(get_db)):
    if body.debt_id is not None and body.direction != Direction.expense:
        raise HTTPException(status_code=422, detail="Debt repayments must have direction='expense'")

    if body.debt_id is not None:
        debt = db.get(Debt, body.debt_id)
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        if not debt.is_active:
            raise HTTPException(status_code=422, detail="Cannot add repayment to an archived debt")

    txn = Transaction(**body.model_dump())
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return TransactionRead.from_orm(txn)


@router.get("/{txn_id}", response_model=TransactionRead)
def get_transaction(txn_id: uuid.UUID, db: Session = Depends(get_db)):
    txn = db.get(Transaction, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionRead.from_orm(txn)


@router.put("/{txn_id}", response_model=TransactionRead)
def update_transaction(txn_id: uuid.UUID, body: TransactionUpdate, db: Session = Depends(get_db)):
    txn = db.get(Transaction, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(txn, field, value)
    db.commit()
    db.refresh(txn)
    return TransactionRead.from_orm(txn)


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(txn_id: uuid.UUID, db: Session = Depends(get_db)):
    txn = db.get(Transaction, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(txn)
    db.commit()

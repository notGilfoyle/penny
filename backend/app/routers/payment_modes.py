import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.payment_mode import PaymentMode
from app.schemas.payment_mode import PaymentModeCreate, PaymentModeUpdate, PaymentModeRead

router = APIRouter(prefix="/payment-modes", tags=["payment-modes"])


@router.get("", response_model=list[PaymentModeRead])
def list_payment_modes(active_only: bool = True, db: Session = Depends(get_db)):
    q = select(PaymentMode)
    if active_only:
        q = q.where(PaymentMode.is_active == True)  # noqa: E712
    q = q.order_by(PaymentMode.name)
    return db.execute(q).scalars().all()


@router.post("", response_model=PaymentModeRead, status_code=201)
def create_payment_mode(body: PaymentModeCreate, db: Session = Depends(get_db)):
    mode = PaymentMode(**body.model_dump())
    db.add(mode)
    db.commit()
    db.refresh(mode)
    return mode


@router.get("/{mode_id}", response_model=PaymentModeRead)
def get_payment_mode(mode_id: uuid.UUID, db: Session = Depends(get_db)):
    mode = db.get(PaymentMode, mode_id)
    if not mode:
        raise HTTPException(status_code=404, detail="Payment mode not found")
    return mode


@router.put("/{mode_id}", response_model=PaymentModeRead)
def update_payment_mode(mode_id: uuid.UUID, body: PaymentModeUpdate, db: Session = Depends(get_db)):
    mode = db.get(PaymentMode, mode_id)
    if not mode:
        raise HTTPException(status_code=404, detail="Payment mode not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(mode, field, value)
    db.commit()
    db.refresh(mode)
    return mode


@router.delete("/{mode_id}", status_code=204)
def archive_payment_mode(mode_id: uuid.UUID, db: Session = Depends(get_db)):
    mode = db.get(PaymentMode, mode_id)
    if not mode:
        raise HTTPException(status_code=404, detail="Payment mode not found")
    mode.is_active = False
    db.commit()

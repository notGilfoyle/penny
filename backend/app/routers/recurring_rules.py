import calendar
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import extract, select
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.recurring_rule import RecurringRule
from app.models.transaction import Transaction
from app.schemas.recurring_rule import RecurringRuleCreate, RecurringRuleUpdate, RecurringRuleRead

router = APIRouter(prefix="/recurring-rules", tags=["recurring-rules"])


@router.get("", response_model=list[RecurringRuleRead])
def list_recurring_rules(active_only: bool = True, db: Session = Depends(get_db)):
    q = select(RecurringRule)
    if active_only:
        q = q.where(RecurringRule.is_active == True)  # noqa: E712
    q = q.order_by(RecurringRule.name)
    rules = db.execute(q).scalars().all()
    return [RecurringRuleRead.from_orm_with_names(r) for r in rules]


@router.get("/pending", response_model=list[RecurringRuleRead])
def pending_recurring_rules(year: int, month: int, db: Session = Depends(get_db)):
    """Active rules due in the given month that have no linked transaction yet."""
    today = date.today()
    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])

    # Nothing is pending for a future month
    if first_day > today:
        return []

    confirmed_ids = db.execute(
        select(Transaction.recurring_rule_id)
        .where(Transaction.recurring_rule_id.isnot(None))
        .where(extract("year", Transaction.txn_date) == year)
        .where(extract("month", Transaction.txn_date) == month)
    ).scalars().all()

    q = (
        select(RecurringRule)
        .where(RecurringRule.is_active == True)  # noqa: E712
        .where(RecurringRule.start_date <= last_day)
        .where(
            (RecurringRule.end_date.is_(None)) | (RecurringRule.end_date >= first_day)
        )
        .order_by(RecurringRule.day_of_month)
    )
    rules = db.execute(q).scalars().all()

    confirmed_set = set(confirmed_ids)
    pending = []
    for rule in rules:
        if rule.id in confirmed_set:
            continue
        # For the current month only include rules whose day has arrived
        if year == today.year and month == today.month:
            if rule.day_of_month > today.day:
                continue
        pending.append(RecurringRuleRead.from_orm_with_names(rule))

    return pending


@router.post("", response_model=RecurringRuleRead, status_code=201)
def create_recurring_rule(body: RecurringRuleCreate, db: Session = Depends(get_db)):
    rule = RecurringRule(**body.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return RecurringRuleRead.from_orm_with_names(rule)


@router.get("/{rule_id}", response_model=RecurringRuleRead)
def get_recurring_rule(rule_id: uuid.UUID, db: Session = Depends(get_db)):
    rule = db.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
    return RecurringRuleRead.from_orm_with_names(rule)


@router.put("/{rule_id}", response_model=RecurringRuleRead)
def update_recurring_rule(rule_id: uuid.UUID, body: RecurringRuleUpdate, db: Session = Depends(get_db)):
    rule = db.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return RecurringRuleRead.from_orm_with_names(rule)


@router.delete("/{rule_id}", status_code=204)
def deactivate_recurring_rule(rule_id: uuid.UUID, db: Session = Depends(get_db)):
    rule = db.get(RecurringRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Recurring rule not found")
    rule.is_active = False
    db.commit()

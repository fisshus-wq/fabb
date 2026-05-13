from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/journal-entries", tags=["journal-entries"])


def _validate_balanced(lines: list):
    total_debit = sum(Decimal(str(l.debit)) for l in lines)
    total_credit = sum(Decimal(str(l.credit)) for l in lines)
    if total_debit != total_credit:
        raise HTTPException(
            status_code=400,
            detail=f"Entry is not balanced: debits {total_debit} != credits {total_credit}",
        )


@router.get("/", response_model=List[schemas.JournalEntry])
def list_entries(db: Session = Depends(get_db)):
    return db.query(models.JournalEntry).order_by(models.JournalEntry.date.desc()).all()


@router.post("/", response_model=schemas.JournalEntry, status_code=201)
def create_entry(payload: schemas.JournalEntryCreate, db: Session = Depends(get_db)):
    existing = db.query(models.JournalEntry).filter(
        models.JournalEntry.reference == payload.reference
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reference already exists")

    if len(payload.lines) < 2:
        raise HTTPException(status_code=400, detail="A journal entry requires at least 2 lines")

    _validate_balanced(payload.lines)

    entry = models.JournalEntry(
        reference=payload.reference,
        date=payload.date,
        description=payload.description,
    )
    db.add(entry)
    db.flush()

    for line in payload.lines:
        account = db.query(models.Account).filter(models.Account.id == line.account_id).first()
        if not account:
            raise HTTPException(status_code=400, detail=f"Account {line.account_id} not found")
        db.add(models.JournalEntryLine(
            journal_entry_id=entry.id,
            account_id=line.account_id,
            debit=line.debit,
            credit=line.credit,
            description=line.description,
        ))

    db.commit()
    db.refresh(entry)
    return entry


@router.get("/{entry_id}", response_model=schemas.JournalEntry)
def get_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    db.delete(entry)
    db.commit()

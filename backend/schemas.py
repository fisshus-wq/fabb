from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from models import AccountType, InvoiceStatus, ExpenseStatus


# --- Account ---

class AccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType
    description: Optional[str] = None
    is_active: bool = True


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class Account(AccountBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# --- Journal Entry ---

class JournalLineBase(BaseModel):
    account_id: int
    debit: Decimal = Decimal("0")
    credit: Decimal = Decimal("0")
    description: Optional[str] = None


class JournalLineCreate(JournalLineBase):
    pass


class JournalLine(JournalLineBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    account: Account


class JournalEntryBase(BaseModel):
    reference: str
    date: date
    description: Optional[str] = None


class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalLineCreate]


class JournalEntry(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    lines: List[JournalLine]
    created_at: datetime


# --- Invoice ---

class InvoiceLineItemBase(BaseModel):
    description: str
    quantity: Decimal = Decimal("1")
    unit_price: Decimal


class InvoiceLineItemCreate(InvoiceLineItemBase):
    pass


class InvoiceLineItem(InvoiceLineItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: Decimal


class InvoiceBase(BaseModel):
    number: str
    customer_name: str
    customer_email: Optional[str] = None
    date: date
    due_date: date
    status: InvoiceStatus = InvoiceStatus.draft
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    line_items: List[InvoiceLineItemCreate]


class InvoiceUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None


class Invoice(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    line_items: List[InvoiceLineItem]
    created_at: datetime

    @property
    def total(self) -> Decimal:
        return sum(item.amount for item in self.line_items)


# --- Expense ---

class ExpenseBase(BaseModel):
    reference: str
    vendor_name: str
    date: date
    due_date: Optional[date] = None
    amount: Decimal
    category: Optional[str] = None
    status: ExpenseStatus = ExpenseStatus.pending
    notes: Optional[str] = None
    account_id: Optional[int] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    vendor_name: Optional[str] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    status: Optional[ExpenseStatus] = None
    notes: Optional[str] = None
    account_id: Optional[int] = None


class Expense(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

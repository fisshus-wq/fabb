"""Run once to populate the database with sample data: python seed.py"""
from datetime import date
from database import SessionLocal, engine, Base
import models

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# --- Accounts ---
accounts_data = [
    ("1000", "Cash",                    "asset",     "Primary cash account"),
    ("1100", "Accounts Receivable",     "asset",     "Money owed by customers"),
    ("1200", "Inventory",               "asset",     "Goods held for sale"),
    ("2000", "Accounts Payable",        "liability", "Money owed to vendors"),
    ("2100", "Accrued Expenses",        "liability", "Expenses incurred but not yet paid"),
    ("3000", "Owner's Equity",          "equity",    "Owner capital"),
    ("3100", "Retained Earnings",       "equity",    "Accumulated profits"),
    ("4000", "Sales Revenue",           "income",    "Revenue from product sales"),
    ("4100", "Service Revenue",         "income",    "Revenue from services"),
    ("5000", "Cost of Goods Sold",      "expense",   "Direct cost of products sold"),
    ("5100", "Rent Expense",            "expense",   "Office / warehouse rent"),
    ("5200", "Software & Subscriptions","expense",   "SaaS tools and software licences"),
    ("5300", "Salaries Expense",        "expense",   "Employee wages"),
    ("5400", "Marketing Expense",       "expense",   "Advertising and promotions"),
]

account_map = {}
for code, name, atype, desc in accounts_data:
    existing = db.query(models.Account).filter_by(code=code).first()
    if not existing:
        a = models.Account(code=code, name=name, account_type=atype, description=desc)
        db.add(a)
        db.flush()
        account_map[code] = a.id
    else:
        account_map[code] = existing.id

# --- Journal Entries ---
entries_data = [
    {
        "reference": "JE-001",
        "date": date(2026, 1, 1),
        "description": "Initial owner investment",
        "lines": [
            ("1000", 50000, 0, "Cash injection"),
            ("3000", 0, 50000, "Owner equity"),
        ],
    },
    {
        "reference": "JE-002",
        "date": date(2026, 1, 15),
        "description": "January rent payment",
        "lines": [
            ("5100", 2500, 0, "Office rent Jan"),
            ("1000", 0, 2500, "Cash payment"),
        ],
    },
    {
        "reference": "JE-003",
        "date": date(2026, 2, 1),
        "description": "Sales revenue recognition",
        "lines": [
            ("1100", 12000, 0, "Invoice to Acme Corp"),
            ("4000", 0, 12000, "Product sales"),
        ],
    },
]

for e in entries_data:
    if not db.query(models.JournalEntry).filter_by(reference=e["reference"]).first():
        entry = models.JournalEntry(reference=e["reference"], date=e["date"], description=e["description"])
        db.add(entry)
        db.flush()
        for code, debit, credit, desc in e["lines"]:
            db.add(models.JournalEntryLine(
                journal_entry_id=entry.id,
                account_id=account_map[code],
                debit=debit, credit=credit, description=desc,
            ))

# --- Invoices ---
invoices_data = [
    {
        "number": "INV-001",
        "customer_name": "Acme Corp",
        "customer_email": "billing@acme.com",
        "date": date(2026, 2, 1),
        "due_date": date(2026, 3, 1),
        "status": "paid",
        "notes": "Q1 software licences",
        "items": [
            ("Annual licence – Pro plan", 3, 1200),
            ("Onboarding & setup", 1, 800),
        ],
    },
    {
        "number": "INV-002",
        "customer_name": "Globex Industries",
        "customer_email": "ap@globex.io",
        "date": date(2026, 3, 10),
        "due_date": date(2026, 4, 10),
        "status": "sent",
        "notes": "Consulting services March",
        "items": [
            ("Strategy consulting – 20 hrs", 20, 250),
            ("Technical review", 1, 1500),
        ],
    },
    {
        "number": "INV-003",
        "customer_name": "Initech LLC",
        "customer_email": "finance@initech.com",
        "date": date(2026, 4, 5),
        "due_date": date(2026, 5, 5),
        "status": "draft",
        "notes": None,
        "items": [
            ("Monthly retainer – April", 1, 3500),
        ],
    },
]

for inv in invoices_data:
    if not db.query(models.Invoice).filter_by(number=inv["number"]).first():
        invoice = models.Invoice(
            number=inv["number"],
            customer_name=inv["customer_name"],
            customer_email=inv["customer_email"],
            date=inv["date"],
            due_date=inv["due_date"],
            status=inv["status"],
            notes=inv["notes"],
        )
        db.add(invoice)
        db.flush()
        for desc, qty, price in inv["items"]:
            db.add(models.InvoiceLineItem(invoice_id=invoice.id, description=desc, quantity=qty, unit_price=price))

# --- Expenses ---
expenses_data = [
    ("EXP-001", "WeWork",         date(2026, 1, 1),  date(2026, 1, 31), 2500,  "Rent",                 "paid",    account_map["5100"], "January office rent"),
    ("EXP-002", "AWS",            date(2026, 1, 5),  date(2026, 2, 5),  430,   "Software",             "paid",    account_map["5200"], "Cloud infrastructure"),
    ("EXP-003", "Notion",         date(2026, 2, 1),  date(2026, 3, 1),  96,    "Software",             "paid",    account_map["5200"], "Annual plan"),
    ("EXP-004", "Meta Ads",       date(2026, 3, 1),  date(2026, 3, 31), 1800,  "Marketing",            "paid",    account_map["5400"], "Q1 ad campaign"),
    ("EXP-005", "Freelancer Co",  date(2026, 4, 1),  date(2026, 4, 30), 3200,  "Salaries",             "pending", account_map["5300"], "April contractor invoice"),
    ("EXP-006", "WeWork",         date(2026, 4, 1),  date(2026, 4, 30), 2500,  "Rent",                 "pending", account_map["5100"], "April office rent"),
]

for ref, vendor, dt, due, amt, cat, status, acct_id, notes in expenses_data:
    if not db.query(models.Expense).filter_by(reference=ref).first():
        db.add(models.Expense(
            reference=ref, vendor_name=vendor, date=dt, due_date=due,
            amount=amt, category=cat, status=status, account_id=acct_id, notes=notes,
        ))

db.commit()
db.close()
print("Seed data loaded successfully.")

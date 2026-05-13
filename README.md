# fabb — Accounting App

A full-stack accounting app built with **FastAPI + SQLite** (backend) and **React + TypeScript** (frontend).

## Features
- **Chart of Accounts** — manage asset, liability, equity, income, and expense accounts
- **Journal Entries** — double-entry bookkeeping with balanced debit/credit validation
- **Invoices** — create and track customer invoices with line items
- **Expenses / Bills** — track vendor bills by status (pending → paid → void)

## Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
API runs at http://localhost:8000  
Interactive docs at http://localhost:8000/docs

### Frontend
```bash
cd frontend
npm install
npm run dev
```
UI runs at http://localhost:5173

## Project Structure
```
fabb/
├── backend/
│   ├── main.py           # FastAPI app + CORS
│   ├── database.py       # SQLAlchemy engine / session
│   ├── models.py         # ORM models
│   ├── schemas.py        # Pydantic schemas
│   └── routers/          # accounts, journal_entries, invoices, expenses
└── frontend/
    └── src/
        ├── api/client.ts # fetch wrapper
        ├── components/   # Layout / sidebar
        └── pages/        # Accounts, JournalEntries, Invoices, Expenses
```

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401 — ensures models are registered before table creation
from routers import accounts, journal_entries, invoices, expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fabb Accounting API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router)
app.include_router(journal_entries.router)
app.include_router(invoices.router)
app.include_router(expenses.router)


@app.get("/health")
def health():
    return {"status": "ok"}

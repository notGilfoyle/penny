from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import categories, payment_modes, debts, recurring_rules, transactions, summary

app = FastAPI(title="Penny API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(categories.router)
app.include_router(payment_modes.router)
app.include_router(debts.router)
app.include_router(recurring_rules.router)
app.include_router(transactions.router)
app.include_router(summary.router)


@app.get("/health")
def health():
    return {"status": "ok"}

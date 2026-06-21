# Penny — Personal Finance PWA

A single-user personal finance web app for tracking income, expenses, debts, and recurring transactions in **₹ INR**. Built as a Progressive Web App — installable on mobile and works offline.

---

## Features

### Dashboard
- Monthly overview with income, expenses, and savings hero cards
- Savings rate percentage and month-over-month delta (↑/↓ vs prior month)
- Expense breakdown with horizontal progress bars per category
- Active debts panel with repayment progress bars
- Month switcher synced to the URL

### Transactions
- Add, edit, and delete transactions (income or expense)
- Filter by month; grouped by date in the list view
- Link transactions to a debt (repayment tracking) or a recurring rule
- Monthly totals strip (income / expenses / saved)

### Debts
- Track loans with a total amount and opened date
- Per-debt detail page with full payment history
- Repayment progress bar; overpayment warning when paid > total
- Archive and reopen debts

### Recurring Rules
- Define scheduled transactions by day-of-month with optional end dates
- **Confirm inbox**: one-tap approve or edit-before-confirm for rules due this month
- Handles month-end edge cases (e.g. a rule for day 31 in February)

### Reports
- 3M / 6M / 12M period selector
- Income vs Expenses area chart (Recharts)
- Monthly Savings bar chart with per-bar green/red coloring
- Monthly breakdown table (newest first)
- Export all transactions to CSV with UTF-8 BOM (Excel-compatible, ₹ symbol safe)

### Categories & Payment Modes
- Manage income and expense categories
- Manage payment modes (cash, UPI, card, etc.)
- Archive unused entries; archived items remain linked to existing transactions

### PWA
- Installable on iOS and Android via browser prompt
- Offline support: app shell precached, API responses cached with NetworkFirst strategy (3s timeout before falling back to cache)
- Google Fonts cached for 1 year
- Mobile bottom tab bar with icons; desktop left sidebar

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 6, Tailwind CSS v3 |
| Charts | Recharts 3 |
| Routing | React Router v6 |
| PWA | vite-plugin-pwa + Workbox |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Database | PostgreSQL 16 |
| Python tooling | `uv` (dependency management) |
| Infrastructure | Docker Compose |

---

## Project Structure

```
penny/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── db.py            # Database session setup
│   │   ├── enums.py         # Shared enums (Direction, etc.)
│   │   └── main.py          # FastAPI app entrypoint
│   ├── alembic/             # Database migrations
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── start.sh             # Runs migrations then starts uvicorn
├── frontend/
│   ├── public/
│   │   ├── icon.svg         # PWA icon (SVG, maskable)
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── components/      # Layout, Modal, MonthSwitcher, forms
│   │   ├── hooks/           # Data fetching hooks (useTransactions, useSummary, etc.)
│   │   ├── lib/             # api.ts, types.ts, format.ts
│   │   └── pages/           # Dashboard, Transactions, Debts, DebtDetail, Recurring, Categories, Reports
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml
├── .env.example
└── docs/
    └── penny_prd.md         # Product requirements document
```

---

## Data Model

```
categories        — income/expense categories (name, kind, is_active)
payment_modes     — UPI, cash, card, etc. (name, is_active)
debts             — loans (name, total_amount, opened_date, is_active)
                    remaining_amount computed on read via SUM of linked transactions
recurring_rules   — scheduled transactions (name, amount, direction, category,
                    payment_mode, day_of_month, start_date, end_date, is_active)
transactions      — individual entries (txn_date, amount, direction, category,
                    payment_mode?, debt?, recurring_rule?, note, source)
```

All primary keys are UUIDs. Decimal fields use `NUMERIC(12, 2)`.

---

## Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- (Optional for local dev without Docker) Python 3.12+, Node.js 20+, PostgreSQL 16

### 1. Clone and configure

```bash
git clone https://github.com/notGilfoyle/penny.git
cd penny
cp .env.example .env
```

The default `.env` works as-is with Docker Compose.

### 2. Start with Docker Compose

```bash
docker compose up --build
```

This starts three services:
- **postgres** — PostgreSQL 16 on port `5432`
- **backend** — FastAPI on port `8000` (runs Alembic migrations on startup)
- **frontend** — Vite dev server on port `5173`

Open **http://localhost:5173** in your browser.

### 3. Stop

```bash
docker compose down
```

Add `-v` to also remove the Postgres data volume: `docker compose down -v`

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or use uv
pip install -e .                                     # or: uv sync

# Set DATABASE_URL to your local Postgres instance
export DATABASE_URL=postgresql://penny:penny@localhost:5432/penny

alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server proxies `/api` to `http://localhost:8000` and also reads `VITE_API_URL` from the environment.

---

## API Reference

All endpoints are served at `http://localhost:8000`. Interactive docs available at **http://localhost:8000/docs**.

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/categories` | List / create categories |
| PUT/DELETE | `/categories/{id}` | Update / archive category |
| GET/POST | `/payment-modes` | List / create payment modes |
| PUT/DELETE | `/payment-modes/{id}` | Update / archive payment mode |
| GET/POST | `/debts` | List / create debts |
| GET/PUT/DELETE | `/debts/{id}` | Get / update / archive debt |
| GET/POST | `/transactions` | List (filterable by month, direction, category, debt) / create |
| GET/PUT/DELETE | `/transactions/{id}` | Get / update / delete transaction |
| GET/POST | `/recurring-rules` | List / create recurring rules |
| GET | `/recurring-rules/pending` | Rules due this month with no confirmed transaction |
| PUT/DELETE | `/recurring-rules/{id}` | Update / archive rule |
| GET | `/summary/{year}/{month}` | Monthly summary with category breakdown and debt panel |
| GET | `/summary/trend` | Month-over-month trend data (`?months=6`) |

---

## PWA / Offline

To test the install prompt and offline behavior, build the frontend and serve the production output:

```bash
cd frontend
npm run build
npm run preview     # serves on http://localhost:4173
```

Chrome will show an install prompt after a few seconds. The service worker caches:
- **App shell** (all JS/CSS/HTML) — precached at build time
- **API responses** — NetworkFirst with 3s timeout, falls back to last cached response
- **Google Fonts** — CacheFirst, cached for 1 year

---

## Currency & Formatting

All amounts are stored as `NUMERIC(12, 2)` and formatted using `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. Chart Y-axes use abbreviated format (₹84K, ₹1.2L).

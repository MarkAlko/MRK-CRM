# MRK CRM V1

מערכת CRM פנימית לחברת MRK – בנייה ושיפוצים.

## Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | Next.js 14 (App Router) · TypeScript · TailwindCSS |
| Backend  | FastAPI · SQLAlchemy 2.0 (async) · Alembic |
| Database | PostgreSQL 15                           |
| Infra    | Docker Compose                          |

## Quick Start

```bash
# 1. Clone & enter the project
git clone <repo-url> && cd MRK-CRM

# 2. Create .env from the example
cp .env.example .env

# 3. Build & start all services
docker compose up --build -d

# 4. Run database migrations
docker compose exec api alembic upgrade head

# 5. Seed demo data
docker compose exec api python -m app.seed
```

The app is now available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Seed Users

| Role      | Email                | Password    |
| --------- | -------------------- | ----------- |
| Admin     | admin@mrk.co.il      | Admin123!   |
| Qualifier | qualifier@mrk.co.il  | Qual123!    |
| Closer    | closer@mrk.co.il     | Close123!   |

The seed script also creates 30 demo leads, 4 campaign mappings, and sample activities.

## Project Structure

```
MRK-CRM/
├── apps/
│   ├── api/                   # FastAPI backend
│   │   ├── app/
│   │   │   ├── models/        # SQLAlchemy models
│   │   │   ├── schemas/       # Pydantic schemas
│   │   │   ├── routers/       # API endpoints
│   │   │   ├── services/      # Business logic (auth, RBAC, phone, mapping)
│   │   │   ├── middleware/     # Auth middleware
│   │   │   ├── main.py        # FastAPI app entry
│   │   │   ├── config.py      # Settings
│   │   │   ├── database.py    # Async engine & session
│   │   │   └── seed.py        # Demo data seeder
│   │   └── migrations/        # Alembic migrations
│   └── web/                   # Next.js frontend
│       └── src/
│           ├── app/           # Pages (App Router)
│           ├── components/    # React components
│           ├── hooks/         # Custom hooks
│           └── lib/           # API client, types, constants
├── docker-compose.yml
└── .env.example
```

## Features

### Boards (Kanban + Table)
Four project-type boards, each with a 10-status pipeline:
- **ממ״ד** – Safe rooms (fast license / full permit)
- **בנייה פרטית** – Private home construction
- **עבודות גמר** – Renovation / finishing work
- **אדריכלות** – Architecture, licensing, interior design

Leads can be viewed in Kanban drag-and-drop or table mode, with filters for status, temperature, source, and bot completion.

### Lead Drawer
Slide-over panel with four tabs:
- **פרטים** – Contact info, status transitions, closer assignment
- **בוט** – Structured WhatsApp bot data per track
- **פעילויות** – Activity timeline (calls, meetings, notes)
- **הצעות** – PDF offer uploads with status tracking

### RBAC
| Role      | Permissions                                       |
| --------- | ------------------------------------------------- |
| Admin     | Full access: all boards, users, settings          |
| Qualifier | View & update leads, log activities (no won/lost) |
| Closer    | Manage assigned leads, close deals                |

### Webhooks
- **Meta (Facebook Lead Ads)** – `POST /api/webhooks/meta` – Creates leads with campaign-to-project mapping and 30-day dedup by phone+project
- **WhatsApp Bot** – `POST /api/webhooks/whatsapp` – Updates bot fields with Hebrew-to-English mapping per track

### Dashboard
KPI cards and charts showing lead counts, monthly new leads, conversion rates, and breakdowns by project type and source.

## Environment Variables

See `.env.example` for all available variables:

| Variable             | Description                        | Default                            |
| -------------------- | ---------------------------------- | ---------------------------------- |
| DATABASE_URL         | Async PostgreSQL connection string | postgresql+asyncpg://...           |
| DATABASE_URL_SYNC    | Sync connection string (Alembic)   | postgresql+psycopg2://...          |
| SECRET_KEY           | JWT signing key                    | change-me-in-production            |
| STORAGE_PATH         | Offer PDF storage directory        | /app/storage/offers                |
| CORS_ORIGINS         | Allowed CORS origins               | http://localhost:3000              |
| NEXT_PUBLIC_API_URL  | API base URL for the frontend      | http://localhost:8000              |

## API Documentation

Once the API is running, interactive docs are available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

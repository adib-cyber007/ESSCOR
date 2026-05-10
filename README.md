# ESSCOR — Ecosystem Intelligence Platform

> **Real-time liquidity stress, whale-concentration risk, and reward-efficiency analytics for the [Bags.fm](https://bags.fm) creator economy on Solana — powered by the Helius API.**

---

## Architecture

```
ESSCOR/
├── backend/          # Node.js · Express · Prisma · TypeScript
│   ├── prisma/       # PostgreSQL schema
│   └── src/
│       ├── services/ # bags.service.ts · helius.service.ts
│       ├── routes/   # /api/bags/* · /api/ecosystem/*
│       ├── jobs/     # sync.job.ts (cron every 20 min)
│       └── db/       # repository.ts
├── analytics/        # Python · FastAPI · SQLAlchemy · Pandas
│   └── services/     # liquidity_risk · whale_analysis · reward_efficiency · recommendations
├── frontend/         # Next.js 14 · Tailwind · Recharts · Framer Motion
│   ├── app/          # / (landing) · /dashboard
│   └── components/   # 6 dashboard widgets
└── docker-compose.yml  # PostgreSQL + pgAdmin (local dev)
```

## Quick Start (Local)

### 1. Prerequisites
- Docker Desktop (for PostgreSQL)
- Node.js ≥ 20
- Python ≥ 3.11

### 2. Start the database
```bash
docker-compose up -d
```
> PostgreSQL at `localhost:5432` · pgAdmin at `http://localhost:5050` (admin@esscor.local / admin)

### 3. Backend
```bash
cd backend
npm install
npx prisma db push      # Apply schema to DB
npm run dev             # http://localhost:3001
```

### 4. Analytics service
```bash
cd analytics
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py           # http://localhost:8000
```

### 5. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:3000
```

### 6. Open the dashboard
Visit **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**

---

## API Reference

### Backend (`:3001`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bags/creators?mint=` | Fetch + persist Bags.fm creator data |
| GET | `/api/bags/fees?mint=` | Fetch lifetime fee data |
| GET | `/api/bags/token?mint=` | Cached DB read |
| GET | `/api/ecosystem/tokens` | List all tracked mints |
| GET | `/api/ecosystem/risk` | Latest risk scores |
| GET | `/health` | Health check |

### Analytics (`:8000`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/ecosystem-health` | Aggregated health score |
| GET | `/analytics/risk?mint=` | Full risk profile per token |
| GET | `/analytics/recommendations?mint=` | Advisory recommendations |
| GET | `/analytics/heatmap` | Liquidity heatmap data |
| GET | `/analytics/whales?limit=` | Top whale concentration tokens |
| GET | `/analytics/rewards` | Reward efficiency rankings |
| GET | `/health` | Health check |

---

## Environment Variables

Copy `.env` and fill in your keys:

```env
BAGS_API_KEY=           # dev.bags.fm API key
BAGS_BASE_URL=https://public-api-v2.bags.fm/api/v1
HELIUS_API_KEY=         # helius.xyz API key
DATABASE_URL=postgresql://esscor:esscor_pass@localhost:5432/esscor_db
```

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
- **Backend** → Jest tests → Railway deploy
- **Analytics** → Pytest → Railway deploy  
- **Frontend** → ESLint + Next.js build → Vercel deploy

### Required GitHub Secrets
| Secret | Description |
|--------|-------------|
| `BAGS_API_KEY` | Bags.fm API key |
| `HELIUS_API_KEY` | Helius API key |
| `RAILWAY_TOKEN` | Railway project token |
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel organisation ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Dashboard Widgets

| Widget | Data Source | Description |
|--------|-------------|-------------|
| 🛡️ Ecosystem Health | `/analytics/ecosystem-health` | Animated arc gauge, 0–100 |
| 💧 Liquidity Heatmap | `/analytics/heatmap` | Bar chart, stress score per token |
| 🐋 Whale Concentration | `/analytics/whales` | Radar + bars, top-10 wallet share |
| 💰 Reward Efficiency | `/analytics/rewards` | Scatter plot + A–D grade panel |
| 🚨 Risk Alert Panel | `/analytics/recommendations` | Sorted advisory cards |
| 👥 Creator Directory | `/api/bags/creators` | Per-token creator list |

---

Built with ❤️ on [Bags.fm](https://bags.fm) + [Helius](https://helius.xyz) + [Solana](https://solana.com)

# Deployment Guide — Vercel (frontend) + Render (backend)

Deploy the **frontend** to Vercel and the **backend + PostgreSQL** to Render with 200k seeded products.

## Architecture

```
Browser → Vercel (Next.js) → /api/* rewrite → Render (Express API) → Render PostgreSQL
```

The frontend proxies API calls through Vercel (`BACKEND_URL`), so **CORS is not required** in the default setup.

---

## Part 1 — Deploy backend on Render

### Option A: Blueprint (recommended)

1. Push this repo to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**.
3. Connect the repository and apply `render.yaml`.
4. Wait for the deploy to finish (~5–15 min on first run — migrations + 200k seed).
5. Copy your API URL, e.g. `https://codevector-api.onrender.com`.
6. Verify:
   ```bash
   curl https://codevector-api.onrender.com/health
   curl "https://codevector-api.onrender.com/api/products?limit=2"
   ```

### Option B: Manual web service

1. **New → PostgreSQL** (free). Note the **Internal Database URL**.
2. **New → Web Service** → connect repo, **Root Directory**: `.` (repo root).
3. Settings:

   | Field | Value |
   |-------|-------|
   | Runtime | Node |
   | Build Command | `npm ci --include=dev && npx prisma generate && npm run build` |
   | Pre-Deploy Command | *(leave empty)* |
   | Start Command | `npm run start:render` |
   | Health Check Path | `/health` |

4. Environment variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Internal Database URL from step 1 |
   | `SEED_COUNT` | `200000` |
   | `SEED_BATCH_SIZE` | `5000` |
   | `DEFAULT_PAGE_LIMIT` | `20` |
   | `MAX_PAGE_LIMIT` | `100` |

5. Deploy and verify with `curl` as above.

### Seed behavior

- First deploy: seeds **200,000** products (configurable via `SEED_COUNT`).
- Redeploys: seed **skips** if data already exists (unless `FORCE_SEED=true`).
- To re-seed: set `FORCE_SEED=true` in Render env vars and redeploy.

### Render free tier notes

- API **spins down** after ~15 min idle — first request may take 30–60s (cold start).
- Free PostgreSQL expires after 90 days (upgrade or export data for long-term use).

---

## Part 2 — Deploy frontend on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) → **Add New Project** → import the same GitHub repo.
2. **Root Directory**: `frontend` (important).
3. Framework: **Next.js** (auto-detected).
4. Environment variables:

   | Key | Value |
   |-----|-------|
   | `BACKEND_URL` | `https://codevector-api.onrender.com` (your Render API URL, no trailing slash) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` (your Vercel URL, set after first deploy) |

   Leave `NEXT_PUBLIC_API_BASE_URL` **unset** — the app uses same-origin `/api` requests proxied to Render.

5. Click **Deploy**.
6. After deploy, update `NEXT_PUBLIC_SITE_URL` to your production Vercel URL if needed, then redeploy.

### Verify frontend

1. Open `https://your-app.vercel.app/products`
2. Products should load with infinite scroll.
3. Category filters and search should work.

---

## Part 3 — Optional CORS (direct API access)

Only needed if you set `NEXT_PUBLIC_API_BASE_URL` to the Render URL (bypassing the Vercel proxy).

In Render, add:

```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Multiple origins: comma-separated, no spaces required.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Failed to fetch` on Vercel | Check `BACKEND_URL` is correct; redeploy Vercel after changing it |
| Empty product list | Check Render logs for seed errors; run `curl .../api/products?limit=1` |
| `Can't reach database` | Verify `DATABASE_URL` uses Render **Internal** URL on the web service |
| `DATABASE_URL is not set` | Link PostgreSQL: Dashboard → your web service → **Environment** → **Add from Database** → select your DB → `DATABASE_URL` |
| Slow first load | Render free tier cold start — normal; subsequent requests are fast |
| Seed timeout on deploy | Lower `SEED_COUNT` to `50000` temporarily, redeploy, then increase |
| Build fails on Vercel | Confirm **Root Directory** is `frontend`, not repo root |

---

## Local parity

```bash
# Backend
docker compose up -d postgres
npm run db:migrate && npm run db:seed
npm run dev

# Frontend (separate terminal)
cd frontend
# .env.local:
#   BACKEND_URL=http://localhost:3000
npm run dev
```

Open http://localhost:3001/products

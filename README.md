# SlotSwapper — ServiceHive SDE Assignment

A peer‑to‑peer time‑slot swapping app.

## Tech Stack
- **Backend:** Node.js, Express, TypeScript, Prisma (PostgreSQL), JWT, Bcrypt
- **Frontend:** React, Vite, TypeScript, React Router, React Query, Zustand
- **DB:** PostgreSQL (via Docker)
- **Extras:** Docker Compose, CORS, .env examples

## Quick Start (Dev)

### 0) Prereqs
- Node 18+
- Docker & docker-compose

### 1) Start Postgres
```bash
docker compose up -d
```
DB will be at `postgres://postgres:postgres@localhost:5432/slotswapper`.

### 2) Backend
```bash
cd backend
cp .env.example .env   # set JWT_SECRET (any strong string)
npm install
npx prisma migrate dev --name init
npm run dev
```
Backend runs on `http://localhost:4000`.

### 3) Frontend
```bash
cd ../frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:4000/api
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## API Overview

### Auth
- `POST /api/auth/signup` → { name, email, password }
- `POST /api/auth/login` → { email, password } → returns JWT

### Events (auth required — Bearer token)
- `GET /api/events` → list of your events
- `POST /api/events` → { title, startTime, endTime, status }
- `PUT /api/events/:id` → update your event
- `DELETE /api/events/:id` → delete your event

### Swap Core
- `GET /api/swappable-slots` → swappable slots owned by others
- `POST /api/swap-request` → { mySlotId, theirSlotId }
- `POST /api/swap-response/:requestId` → { accept: boolean }

**Statuses**
- Event.status ∈ `BUSY | SWAPPABLE | SWAP_PENDING`
- SwapRequest.status ∈ `PENDING | REJECTED | ACCEPTED`

### Assumptions
- Minimal validation for brevity.
- Tokens stored in localStorage for demo purposes.
- Times are ISO strings (UTC).

### Notes
- After accepting a swap:
  - SwapRequest → `ACCEPTED`
  - Exchange `userId` of the two `Event`s
  - Both events set to `BUSY`

---

## Scripts

- `docker-compose.yml` provides Postgres
- `backend`: `npm run dev` (ts-node-dev), `npm run build && npm start` for prod
- `frontend`: Vite dev server

Good luck reviewing!

# Personal Budget Tracker

![CI](https://github.com/SimonLund192/PocketFlow/workflows/CI/badge.svg)
![Deploy](https://github.com/SimonLund192/PocketFlow/workflows/Deploy/badge.svg)

A modern personal finance management application with a Next.js frontend and a FastAPI backend.

## Stack
- Frontend: Next.js 14, React, Tailwind CSS, shadcn/ui, Recharts
- Backend: FastAPI, MongoDB, Motor, Pydantic
- Deployment: Docker and Docker Compose

## Prerequisites
- Docker Desktop
- Node.js 18+ and npm
- Python 3.11
- `MISTRAL_API_KEY` set before running the backend locally

## Python Version
The backend is pinned to Python 3.11.

This repo includes:
- [/.python-version](/Users/simonlund/PersonalCode/PocketFlow/.python-version)
- [/.python-version](/Users/simonlund/PersonalCode/PocketFlow/backend/.python-version)

If your shell still resolves `python3` to an older version, use `python3.11` explicitly when creating the backend virtualenv.

## Running The App
### Docker path
Terminal 1:

```bash
docker-compose up --build
```

This starts:
- Backend API: [http://localhost:8000](http://localhost:8000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- MongoDB: `localhost:27017`

Terminal 2:

```bash
cd frontend
npm install
npm run dev
```

Frontend:
- [http://localhost:3000](http://localhost:3000)

### Local backend dev path
From the repo root:

```bash
make backend-install-dev
```

That will:
1. Create `backend/.venv` with `python3.11`
2. Upgrade `pip`
3. Install `backend/requirements-dev.txt`

To run backend tests after that:

```bash
make backend-test
```

If you prefer the manual commands:

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
python -m pytest
```

## Seeding Sample Data
After starting docker-compose, run:

```bash
cd backend
python app/seed_data.py
```

## Stopping The App
```bash
docker-compose down
```

To remove volumes too:

```bash
docker-compose down -v
```

## Testing
### Backend
- Framework: `pytest` + `pytest-asyncio`
- Config: [backend/pyproject.toml](/Users/simonlund/PersonalCode/PocketFlow/backend/pyproject.toml)

Recommended:

```bash
make backend-test
```

Docker alternative:

```bash
docker compose run --rm backend pytest
```

### Frontend
Type-check:

```bash
cd frontend
npx tsc --noEmit
```

Build:

```bash
cd frontend
npm run build
```

## API Endpoints
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/balance-trends` - Get balance trends for chart
- `GET /api/dashboard/expense-breakdown` - Get expense breakdown by category
- `DELETE /api/transactions/{id}` - Delete a transaction

## File Structure
At a high level, this repo is split into a Next.js frontend and a FastAPI backend:

```text
PocketFlow/
├── frontend/                  # Next.js 14 App Router (TypeScript)
│   ├── app/
│   ├── components/
│   ├── contexts/
│   └── lib/
├── backend/                   # FastAPI + MongoDB
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   └── requirements-dev.txt
├── docs/
├── docker-compose.yml
└── Makefile
```

## Development Notes
- Frontend usually runs locally with hot reload
- Backend and MongoDB can run via Docker, or the backend can run from `backend/.venv`
- If tests fail because `pytest` is missing, the backend virtualenv was probably not created with Python 3.11 yet

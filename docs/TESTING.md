# Testing

This repo has a minimal test scaffold for both backend (FastAPI) and frontend (Next.js).

## Backend (pytest)

Location: `backend/`

### Install deps

```zsh
cd backend
python -m pip install -r requirements.txt
```

### Run tests

```zsh
cd backend
pytest
```

Notes:
- Current smoke tests only hit `/` and `/health` and don’t require MongoDB.

## Frontend (Jest + React Testing Library)

Location: `frontend/`

### Install deps

```zsh
cd frontend
npm install
```

### Run tests

```zsh
cd frontend
npm test
```

CI-style run:

```zsh
cd frontend
npm run test:ci
```

Notes:
- The initial RTL smoke test is intentionally tiny and does not import Next.js pages (to avoid provider/fetch coupling).

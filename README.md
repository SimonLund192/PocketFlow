# Personal Budget Tracker

A modern personal finance management application with a beautiful dashboard interface.

## Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI (Python), MongoDB
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Docker Desktop installed
- Node.js 18+ and npm installed

### Running the Application

**Terminal 1 - Backend & Database:**
```bash
docker-compose up --build
```

This will start:
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **MongoDB**: localhost:27017

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3000

### Seed Sample Data

After starting docker-compose, run this to populate the database with sample data:

```bash
cd backend
python app/seed_data.py
```

### Stopping the Application

Stop docker-compose:
```bash
docker-compose down
```

To remove volumes as well:
```bash
docker-compose down -v
```

## API Endpoints

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create a new transaction
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/balance-trends` - Get balance trends for chart
- `GET /api/dashboard/expense-breakdown` - Get expense breakdown by category
- `DELETE /api/transactions/{id}` - Delete a transaction

## Project Structure

```
budget-tracker/
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── main.py       # FastAPI app
│   │   ├── routes.py     # API routes
│   │   ├── models.py     # Pydantic models
│   │   ├── database.py   # MongoDB connection
│   │   └── seed_data.py  # Sample data seeder
│   ├── Dockerfile
│   └── requirements.txt
└── docker-compose.yml # Docker orchestration (backend + MongoDB only)
```

## Development

Frontend runs locally with hot reload for faster development.
Backend and MongoDB run in Docker containers.

## Testing

See `docs/TESTING.md` for the full notes.

### Backend tests (pytest)

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m pytest
```

### Frontend tests (Jest + React Testing Library)

```bash
cd frontend
npm install
npm test
```

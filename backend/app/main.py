from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes import transactions, dashboard, auth, categories, database, budgets, budget_line_items
from app.database import create_indexes
import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler - runs on startup and shutdown"""
    # Startup: Create database indexes
    logger.info("Creating database indexes...")
    try:
        await create_indexes()
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")
    
    yield
    
    # Shutdown: cleanup if needed
    logger.info("Application shutting down")


app = FastAPI(
    title="PocketFlow API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["authentication"])
app.include_router(categories.router, tags=["categories"])
app.include_router(budgets.router, tags=["budgets"])
app.include_router(budget_line_items.router, tags=["budget-line-items"])
app.include_router(database.router, tags=["database"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "PocketFlow API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

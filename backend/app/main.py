from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import transactions, dashboard, auth, categories

app = FastAPI(title="PocketFlow API", version="1.0.0")

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
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

@app.get("/")
async def root():
    return {"message": "PocketFlow API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

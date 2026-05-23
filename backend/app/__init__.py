from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import engine, Base
from .routers import documents, analysis, workflows, chat

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Document Analysis Workflow",
    description="Full-stack AI-powered document analysis platform for Microsoft AI Hackathon",
    version="1.0.0",
)

# CORS
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(documents.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")
app.include_router(workflows.router, prefix="/api")
app.include_router(chat.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "AI Document Analysis Workflow API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "ai_provider": settings.ai_provider}

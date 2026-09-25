from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.services.did.did_service import DIDService
from backend.app.services.blockchain.blockchain_service import BlockchainService
from backend.app.services.policy.policy_engine import PolicyEngine
from backend.app.services.ai.security_analytics import AISecurityAnalytics
from backend.app.services.storage.encrypted_storage import EncryptedStorageService

# Initialize database schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=f"{settings.PROJECT_TAGLINE} — Smart India Hackathon 2026 ({settings.SIH_PROBLEM_ID}) for {settings.ORGANIZATION}",
    version="2026.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {
        "status": "ONLINE",
        "service": settings.PROJECT_NAME,
        "tagline": settings.PROJECT_TAGLINE,
        "organization": settings.ORGANIZATION,
        "problem_id": settings.SIH_PROBLEM_ID,
        "blockchain_provider": settings.BLOCKCHAIN_PROVIDER,
        "architecture": "Hyperledger Fabric Ready + Local Tamper-Evident Ledger",
    }

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API. Access documentation at /docs",
        "organization": settings.ORGANIZATION,
    }

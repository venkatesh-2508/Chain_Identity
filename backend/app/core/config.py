import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ChainIdentity"
    PROJECT_TAGLINE: str = "Decentralized Trust, Identity, Access & Digital Asset Platform"
    ORGANIZATION: str = "Bharat Electronics Limited (BEL)"
    SIH_PROBLEM_ID: str = "SIH26125"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chainidentity-sih2026-bel-secure-key-998877")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://chainadmin:chainpass@localhost:5432/chainidentity_db")
    BLOCKCHAIN_PROVIDER: str = os.getenv("BLOCKCHAIN_PROVIDER", "local")
    OFFCHAIN_STORAGE_PATH: str = os.getenv("OFFCHAIN_STORAGE_PATH", "./data/offchain_storage")

    class Config:
        case_sensitive = True

settings = Settings()

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# Auth
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user: Dict[str, Any]

# User
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    department: Optional[str] = None
    organization: Optional[str] = None
    customDidSuffix: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    did: str
    role: str
    organization: str
    department: str
    status: str
    createdAt: Optional[Any] = None

# Asset
class AssetCreate(BaseModel):
    assetId: str
    name: str
    description: Optional[str] = ""
    assetType: str
    classification: str

class AssetAllocate(BaseModel):
    userDid: str
    permissions: List[str]

class AssetRevoke(BaseModel):
    userDid: str
    reason: Optional[str] = "Revoked under security policy decision"

class AccessActionRequest(BaseModel):
    action: str

# Access Request
class AccessRequestCreate(BaseModel):
    assetId: str
    action: str
    reason: str
    durationHours: Optional[int] = 24

class AccessRequestDeny(BaseModel):
    reason: Optional[str] = "Denied by security officer"

# Emergency Access
class EmergencyAccessCreate(BaseModel):
    userDid: str
    assetId: str
    reason: str
    durationMinutes: int = 60

# Investigation
class InvestigateAlert(BaseModel):
    status: str
    notes: Optional[str] = None

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(128), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    password_hash = Column(String(256), nullable=False)
    did = Column(String(128), unique=True, index=True, nullable=False)
    role = Column(String(64), nullable=False, default="EMPLOYEE")
    organization = Column(String(128), default="Bharat Electronics Limited (BEL)")
    department = Column(String(128), default="Engineering")
    status = Column(String(32), default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DigitalAsset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    asset_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. AST-0017
    token_id = Column(String(64), unique=True, index=True, nullable=False) # e.g. NFT-AST-0017
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    asset_type = Column(String(64), nullable=False) # PROJECT, DOCUMENT, etc.
    classification = Column(String(64), nullable=False) # CONFIDENTIAL, etc.
    owner = Column(String(128), default="Bharat Electronics Limited (BEL)")
    owner_did = Column(String(128), nullable=False)
    is_tokenized = Column(Boolean, default=False)
    mint_transaction_id = Column(String(128), nullable=True)
    mint_timestamp = Column(DateTime, nullable=True)
    offchain_hash = Column(String(128), nullable=True)
    offchain_id = Column(String(128), nullable=True)
    status = Column(String(32), default="REGISTERED")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AssetAllocation(Base):
    __tablename__ = "asset_allocations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    asset_id = Column(String(64), nullable=False, index=True)
    asset_name = Column(String(128), nullable=False)
    user_id = Column(String(36), nullable=False)
    user_did = Column(String(128), nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    role = Column(String(64), nullable=False)
    permissions = Column(JSON, default=list) # ["VIEW", "EDIT"]
    allocated_by = Column(String(128), nullable=False)
    allocated_by_did = Column(String(128), nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(32), default="ACTIVE") # ACTIVE, REVOKED, EXPIRED
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(String(128), nullable=True)
    revocation_reason = Column(Text, nullable=True)

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    asset_id = Column(String(64), nullable=False, index=True)
    asset_name = Column(String(128), nullable=False)
    user_id = Column(String(36), nullable=False)
    user_did = Column(String(128), nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    user_role = Column(String(64), nullable=False)
    action = Column(String(32), nullable=False)
    reason = Column(Text, nullable=False)
    duration_hours = Column(Integer, default=24)
    status = Column(String(32), default="PENDING") # PENDING, APPROVED, DENIED
    requested_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
    decided_by = Column(String(128), nullable=True)
    decision_reason = Column(Text, nullable=True)
    transaction_id = Column(String(128), nullable=True)

class LedgerEventModel(Base):
    __tablename__ = "ledger_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    index = Column(Integer, unique=True, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    event_type = Column(String(64), nullable=False)
    actor_did = Column(String(128), nullable=False, index=True)
    asset_id = Column(String(64), nullable=True, index=True)
    transaction_id = Column(String(128), unique=True, index=True, nullable=False)
    payload = Column(JSON, nullable=False)
    previous_hash = Column(String(128), nullable=False)
    current_hash = Column(String(128), nullable=False)
    signature = Column(String(128), nullable=True)

class SecurityAlertModel(Base):
    __tablename__ = "security_alerts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    anomaly_score = Column(Integer, nullable=False)
    risk_level = Column(String(32), nullable=False) # LOW, MEDIUM, HIGH
    reason = Column(Text, nullable=False)
    user_did = Column(String(128), nullable=True, index=True)
    user_name = Column(String(128), nullable=True)
    asset_id = Column(String(64), nullable=True, index=True)
    asset_name = Column(String(128), nullable=True)
    details = Column(JSON, default=dict)
    status = Column(String(32), default="UNRESOLVED") # UNRESOLVED, INVESTIGATING, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow)
    investigated_by = Column(String(128), nullable=True)
    investigation_notes = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class EmergencyAccessModel(Base):
    __tablename__ = "emergency_accesses"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), nullable=False)
    user_did = Column(String(128), nullable=False, index=True)
    user_name = Column(String(128), nullable=False)
    asset_id = Column(String(64), nullable=False, index=True)
    asset_name = Column(String(128), nullable=False)
    reason = Column(Text, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    approved_by = Column(String(128), nullable=False)
    approved_by_did = Column(String(128), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    expiry_time = Column(DateTime, nullable=False)
    status = Column(String(32), default="ACTIVE")
    transaction_id = Column(String(128), nullable=False)

class OffchainObjectModel(Base):
    __tablename__ = "offchain_objects"

    id = Column(String(64), primary_key=True)
    asset_id = Column(String(64), nullable=False, index=True)
    filename = Column(String(256), nullable=False)
    mime_type = Column(String(64), default="application/octet-stream")
    size_bytes = Column(Integer, nullable=False)
    sha256_hash = Column(String(128), nullable=False, index=True)
    encrypted_file_path = Column(String(512), nullable=False)
    iv_hex = Column(String(64), nullable=False)
    auth_tag_hex = Column(String(64), nullable=False)
    uploaded_by_did = Column(String(128), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

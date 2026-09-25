# CHAINIDENTITY
**“Decentralized Trust, Identity, Access & Digital Asset Platform”**

### Smart India Hackathon 2026
- **Problem Statement ID**: SIH26125
- **Problem**: Blockchain-Based Secure Platform for Identity, Access Control & Digital Asset Management
- **Theme**: Blockchain & Cybersecurity
- **Organization**: Bharat Electronics Limited (BEL)

---

## 1. Executive Summary & Core Principle

ChainIdentity is a production-ready, full-stack cybersecurity and blockchain architecture bridging verifiable digital identity (W3C DID), fine-grained role-based policy enforcement (RBAC), organizational digital asset tokenization, encrypted off-chain storage, tamper-evident distributed ledger auditing, and AI security anomaly surveillance.

### Core Principle
> **“AI analyzes activity and alerts security teams; smart contracts remain the authorization enforcement layer.”**
> AI never becomes the authorization mechanism. Authorization is strictly decided by the deterministic Smart Contract / Policy Engine layer.

---

## 2. Architecture & Data Flow

```text
React Frontend (TypeScript + Tailwind CSS + Lucide + Recharts)
       ↓ (JWT Bearer Token / REST API)
FastAPI / Express Security Gateway
       ↓
Service Layer
       ↓
┌──────────────────┬──────────────────────┬──────────────────────┐
│ PostgreSQL / DB  │ Policy & Smart       │ AI Security          │
│ Persistence      │ Contract Engine      │ Analytics Daemon     │
└──────────────────┴──────────┬───────────┴──────────────────────┘
                              ↓
                   Blockchain Service
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
Local Ledger (SHA-256 Hash Chain)       Hyperledger Fabric Adapter
        ↓                                           ↓
Tamper-Evident Distributed Audit Ledger & On-Chain Hash References
```

### Encrypted Off-Chain Storage Architecture
Raw large files and sensitive defense payloads are never stored on the blockchain.
1. Payload encrypted client/gateway-side using **AES-256-GCM** with unique IV and auth tags.
2. Cryptographic **SHA-256 hash** generated from plaintext.
3. Encrypted ciphertext saved in isolated off-chain vault.
4. SHA-256 hash anchored in blockchain block as immutable integrity proof.
5. On read: Smart contract checks permission → ciphertext retrieved → decrypted → plaintext SHA-256 compared against ledger hash. If altered, access is rejected immediately and high-risk security alert triggered!

---

## 3. Four User Roles & Seeded Demo Accounts

| Role | Email | Password | DID | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin@chainidentity.demo` | `admin123` | `did:chainidentity:admin001` | Enterprise Security Architecture |
| **Security Manager** | `security@chainidentity.demo` | `security123` | `did:chainidentity:sec001` | Cyber Security Ops Center (C-SOC) |
| **Employee** | `rahul@chainidentity.demo` | `rahul123` | `did:chainidentity:rahul123` | Tactical Defense Systems |
| **Auditor** | `auditor@chainidentity.demo` | `auditor123` | `did:chainidentity:aud001` | Standards & Blockchain Audit |

---

## 4. Primary Live Demo Walkthrough (SIH 2026 Script)

1. **Step 1: Admin Creates User & DID**: Admin registers Rahul Kumar → generates `did:chainidentity:rahul123` + W3C DID Document.
2. **Step 2: Admin Registers & Tokenizes Asset**: Admin registers Project A17 (`AST-0017`), mints token `NFT-AST-0017` with transaction hash.
3. **Step 3: Allocate Asset**: Admin/SecManager allocates Project A17 to Rahul Kumar with `EDIT` permission.
4. **Step 4: Smart Contract ALLOW**: Login as Rahul, request `EDIT` action → Policy engine evaluates grant → **ALLOW** with `ACCESS_ALLOWED` ledger record.
5. **Step 5: Normal AI Surveillance**: AI analytics runs in background → flags as **LOW RISK** (normal working hours, 1 req/hr).
6. **Step 6: Security Manager Revocation**: Login as Security Manager, revoke Rahul's permission on Project A17 → records `PERMISSION_REVOKED`.
7. **Step 7: Smart Contract DENY**: Rahul requests `EDIT` again → Policy engine strictly enforces revocation → **DENY** ("Permission revoked") with `ACCESS_DENIED`.
8. **Step 8: AI Anomaly Detection**: Trigger off-hours burst test (5 requests at 2 AM) → AI engine flags **HIGH RISK** (score 94) → generates `SECURITY_ALERT`.
9. **Step 9: Security Investigation**: Security Manager clicks "Investigate" → examines user DID, denied requests, and blockchain audit trail.
10. **Step 10: Auditor Integrity Verification**: Auditor opens Audit Explorer → clicks **"VERIFY INTEGRITY"** → recalculates the SHA-256 chain from Genesis to top block → returns **INTEGRITY VERIFIED**.

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Router
- **Backend**: Python FastAPI / Express Full-Stack Server, Pydantic, SQLAlchemy, Alembic, JWT, Bcrypt
- **Blockchain**: Hyperledger Fabric-ready architecture, Go Chaincode contract, Local Tamper-Evident SHA-256 Hash Chain
- **Storage**: AES-256-GCM encrypted off-chain storage with cryptographic SHA-256 on-chain anchoring
- **AI**: Anomaly detection engine analyzing access frequency, timestamps, and denied request spikes

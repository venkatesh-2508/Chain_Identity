import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chainidentity-sih2026-bel-secure-key-998877';

// Detect serverless environment (e.g. Vercel, AWS Lambda) where process.cwd() is read-only
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_DIR = isServerless ? path.resolve('/tmp', 'chainidentity_data') : BUNDLED_DATA_DIR;
const DB_FILE = path.join(DATA_DIR, 'chainidentity_db.json');
const OFFCHAIN_DIR = path.join(DATA_DIR, 'offchain_storage');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(OFFCHAIN_DIR)) {
    fs.mkdirSync(OFFCHAIN_DIR, { recursive: true });
  }
} catch (e) {
  // Read-only filesystem warning handled gracefully
  console.warn('Notice: Storage directory creation skipped (read-only filesystem):', e);
}

// Interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  did: string;
  role: 'ADMINISTRATOR' | 'SECURITY_MANAGER' | 'EMPLOYEE' | 'AUDITOR';
  organization: string;
  department: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  createdAt: string;
}

export interface DIDDocument {
  id: string;
  controller: string;
  verificationMethod: {
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase: string;
  }[];
  authentication: string[];
  service: {
    id: string;
    type: string;
    serviceEndpoint: string;
  }[];
  created: string;
  updated: string;
}

export interface DigitalAsset {
  id: string;
  assetId: string; // e.g. AST-0017
  tokenId: string; // e.g. NFT-AST-0017
  name: string;
  description: string;
  assetType: 'PROJECT' | 'DOCUMENT' | 'SOFTWARE_LICENSE' | 'EQUIPMENT' | 'ENTERPRISE_RESOURCE';
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'TOP_SECRET';
  owner: string;
  ownerDid: string;
  isTokenized: boolean;
  mintTransactionId?: string;
  mintTimestamp?: string;
  offchainHash?: string;
  offchainId?: string;
  status: 'REGISTERED' | 'TOKENIZED' | 'ALLOCATED' | 'DECOMMISSIONED';
  createdAt: string;
  updatedAt: string;
}

export interface AssetAllocation {
  id: string;
  assetId: string; // AST-0017
  assetName: string;
  userId: string;
  userDid: string;
  userName: string;
  role: string;
  permissions: ('VIEW' | 'EDIT' | 'TRANSFER' | 'ALLOCATE' | 'EXECUTE')[];
  allocatedBy: string;
  allocatedByDid: string;
  allocatedAt: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface AccessRequest {
  id: string;
  assetId: string;
  assetName: string;
  userId: string;
  userDid: string;
  userName: string;
  userRole: string;
  action: 'VIEW' | 'EDIT' | 'TRANSFER' | 'DOWNLOAD';
  reason: string;
  durationHours: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  transactionId?: string;
}

export interface LedgerEvent {
  index: number;
  timestamp: string;
  eventId: string;
  eventType: 
    | 'GENESIS'
    | 'DID_CREATED'
    | 'ROLE_ASSIGNED'
    | 'ASSET_REGISTERED'
    | 'ASSET_MINTED'
    | 'ASSET_ALLOCATED'
    | 'ACCESS_REQUESTED'
    | 'ACCESS_ALLOWED'
    | 'ACCESS_DENIED'
    | 'PERMISSION_UPDATED'
    | 'PERMISSION_REVOKED'
    | 'ASSET_TRANSFERRED'
    | 'EMERGENCY_ACCESS'
    | 'SECURITY_ALERT'
    | 'STORAGE_VERIFIED'
    | 'TAMPER_DETECTED';
  actorDid: string;
  assetId?: string;
  transactionId: string;
  payload: Record<string, any>;
  previousHash: string;
  currentHash: string;
  signature?: string;
}

export interface SecurityAlert {
  id: string;
  anomalyScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
  eventId?: string;
  userDid?: string;
  userName?: string;
  assetId?: string;
  assetName?: string;
  details: Record<string, any>;
  status: 'UNRESOLVED' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: string;
  investigatedBy?: string;
  investigationNotes?: string;
  resolvedAt?: string;
}

export interface EmergencyAccess {
  id: string;
  userId: string;
  userDid: string;
  userName: string;
  assetId: string;
  assetName: string;
  reason: string;
  durationMinutes: number;
  approvedBy: string;
  approvedByDid: string;
  startTime: string;
  expiryTime: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  transactionId: string;
}

export interface OffchainFile {
  id: string;
  assetId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  sha256Hash: string;
  encryptedFilePath: string;
  ivHex: string;
  authTagHex: string;
  uploadedByDid: string;
  uploadedAt: string;
  verifiedAt?: string;
}

export interface AppNotification {
  id: string;
  targetRole?: string;
  targetUserDid?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  read: boolean;
  createdAt: string;
  link?: string;
}

// Hashing helper
export function computeBlockHash(
  index: number,
  timestamp: string,
  eventId: string,
  eventType: string,
  actorDid: string,
  assetId: string | undefined,
  transactionId: string,
  payload: Record<string, any>,
  previousHash: string
): string {
  const canonical = JSON.stringify({
    index,
    timestamp,
    eventId,
    eventType,
    actorDid,
    assetId: assetId || '',
    transactionId,
    payload,
    previousHash,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function generateTxId(): string {
  return '0x' + crypto.randomBytes(32).toString('hex');
}

// Database schema container
interface DBStore {
  users: User[];
  dids: Record<string, DIDDocument>;
  assets: DigitalAsset[];
  allocations: AssetAllocation[];
  accessRequests: AccessRequest[];
  ledger: LedgerEvent[];
  securityAlerts: SecurityAlert[];
  emergencyAccesses: EmergencyAccess[];
  offchainFiles: Record<string, OffchainFile>;
  notifications: AppNotification[];
  blockchainProvider: 'local' | 'fabric';
  ledgerTampered: boolean;
}

let db: DBStore;

function initDatabase() {
  // If in serverless mode and DB_FILE in /tmp doesn't exist, seed from bundled database if available
  if (isServerless && !fs.existsSync(DB_FILE)) {
    const bundledDbPath = path.join(BUNDLED_DATA_DIR, 'chainidentity_db.json');
    if (fs.existsSync(bundledDbPath)) {
      try {
        const bundledData = fs.readFileSync(bundledDbPath, 'utf8');
        db = JSON.parse(bundledData);
        if (db.ledger && db.ledger.length > 0) {
          try {
            fs.writeFileSync(DB_FILE, bundledData, 'utf8');
          } catch (_) {}
          return;
        }
      } catch (err) {
        console.warn('Could not read bundled database:', err);
      }
    }
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      db = JSON.parse(data);
      if (!db.ledger || db.ledger.length === 0) {
        seedInitialData();
      }
      return;
    } catch (e) {
      console.error('Failed to parse database, re-seeding...', e);
    }
  }
  seedInitialData();
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db:', err);
  }
}

function seedInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const secHash = bcrypt.hashSync('security123', salt);
  const rahulHash = bcrypt.hashSync('rahul123', salt);
  const auditorHash = bcrypt.hashSync('auditor123', salt);

  const initialUsers: User[] = [
    {
      id: 'usr-admin-01',
      name: 'System Administrator',
      email: 'admin@chainidentity.demo',
      passwordHash: adminHash,
      did: 'did:chainidentity:admin001',
      role: 'ADMINISTRATOR',
      organization: 'Bharat Electronics Limited (BEL)',
      department: 'Enterprise Security Architecture',
      status: 'ACTIVE',
      createdAt: '2026-09-20T08:00:00Z',
    },
    {
      id: 'usr-sec-01',
      name: 'Vikram Joshi (SecOps)',
      email: 'security@chainidentity.demo',
      passwordHash: secHash,
      did: 'did:chainidentity:sec001',
      role: 'SECURITY_MANAGER',
      organization: 'Bharat Electronics Limited (BEL)',
      department: 'Cyber Security Operations Center (C-SOC)',
      status: 'ACTIVE',
      createdAt: '2026-09-20T08:15:00Z',
    },
    {
      id: 'usr-rahul-01',
      name: 'Rahul Kumar',
      email: 'rahul@chainidentity.demo',
      passwordHash: rahulHash,
      did: 'did:chainidentity:rahul123',
      role: 'EMPLOYEE',
      organization: 'Bharat Electronics Limited (BEL)',
      department: 'Defense Radar & Tactical Systems',
      status: 'ACTIVE',
      createdAt: '2026-09-20T08:30:00Z',
    },
    {
      id: 'usr-auditor-01',
      name: 'Dr. Ananya Roy',
      email: 'auditor@chainidentity.demo',
      passwordHash: auditorHash,
      did: 'did:chainidentity:aud001',
      role: 'AUDITOR',
      organization: 'Bharat Electronics Limited (BEL)',
      department: 'Compliance, Standards & Blockchain Audit',
      status: 'ACTIVE',
      createdAt: '2026-09-20T08:45:00Z',
    },
  ];

  const dids: Record<string, DIDDocument> = {};
  for (const u of initialUsers) {
    dids[u.did] = {
      id: u.did,
      controller: 'did:chainidentity:bel-root-authority',
      verificationMethod: [
        {
          id: `${u.did}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: u.did,
          publicKeyMultibase: 'z' + crypto.createHash('sha256').update(u.did).digest('hex').substring(0, 44),
        },
      ],
      authentication: [`${u.did}#key-1`],
      service: [
        {
          id: `${u.did}#chainidentity-agent`,
          type: 'ChainIdentityDecentralizedAgent',
          serviceEndpoint: 'https://chainidentity.bel.in/did-resolver/v1',
        },
      ],
      created: u.createdAt,
      updated: u.createdAt,
    };
  }

  // Assets
  const initialAssets: DigitalAsset[] = [
    {
      id: 'ast-0017-uuid',
      assetId: 'AST-0017',
      tokenId: 'NFT-AST-0017',
      name: 'Project A17',
      description: 'Tactical Defense Communication & Signal Processing Module (Phase III)',
      assetType: 'PROJECT',
      classification: 'CONFIDENTIAL',
      owner: 'Bharat Electronics Limited (BEL)',
      ownerDid: 'did:chainidentity:admin001',
      isTokenized: true,
      mintTransactionId: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      mintTimestamp: '2026-09-20T09:00:00Z',
      offchainHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      offchainId: 'offchain-ast-0017',
      status: 'ALLOCATED',
      createdAt: '2026-09-20T08:50:00Z',
      updatedAt: '2026-09-20T09:15:00Z',
    },
    {
      id: 'ast-0024-uuid',
      assetId: 'AST-0024',
      tokenId: 'NFT-AST-0024',
      name: 'Radar Firmware v4.2',
      description: 'L-Band 3D Surveillance Radar Signal Processing Firmware and LUT Tables',
      assetType: 'SOFTWARE_LICENSE',
      classification: 'RESTRICTED',
      owner: 'Bharat Electronics Limited (BEL)',
      ownerDid: 'did:chainidentity:admin001',
      isTokenized: true,
      mintTransactionId: '0x9923ca1029ba8810291e0a29910d8a11bc234a91901a833441c9910283bade81',
      mintTimestamp: '2026-09-20T09:20:00Z',
      offchainHash: 'c4ca4238a0b923820dcc509a6f75849b29381029381029381029381029381029',
      offchainId: 'offchain-ast-0024',
      status: 'TOKENIZED',
      createdAt: '2026-09-20T09:10:00Z',
      updatedAt: '2026-09-20T09:20:00Z',
    },
    {
      id: 'ast-0089-uuid',
      assetId: 'AST-0089',
      tokenId: 'NFT-AST-0089',
      name: 'BEL Defense Specs 2026',
      description: 'Cryptographic Architecture Specifications for Next-Gen Avionics Systems',
      assetType: 'DOCUMENT',
      classification: 'TOP_SECRET',
      owner: 'Bharat Electronics Limited (BEL)',
      ownerDid: 'did:chainidentity:admin001',
      isTokenized: true,
      mintTransactionId: '0xaa81239bb1029384759281726354182930491827364519283746519283746192',
      mintTimestamp: '2026-09-20T09:30:00Z',
      offchainHash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
      offchainId: 'offchain-ast-0089',
      status: 'TOKENIZED',
      createdAt: '2026-09-20T09:25:00Z',
      updatedAt: '2026-09-20T09:30:00Z',
    },
    {
      id: 'ast-0105-uuid',
      assetId: 'AST-0105',
      tokenId: 'NFT-AST-0105',
      name: 'Frequency Calibration Unit 9B',
      description: 'High-Precision RF Signal Generator & Vector Network Analyzer Hardware Rig',
      assetType: 'EQUIPMENT',
      classification: 'CONFIDENTIAL',
      owner: 'Bharat Electronics Limited (BEL)',
      ownerDid: 'did:chainidentity:admin001',
      isTokenized: true,
      mintTransactionId: '0xbb91827364519283746519283746519283746519283746519283746519283746',
      mintTimestamp: '2026-09-20T09:40:00Z',
      offchainHash: '9e107d9d372bb6826bd81d3542a419d6dae480df3e7a3d90f8e3a2feb0a63aa7',
      offchainId: 'offchain-ast-0105',
      status: 'TOKENIZED',
      createdAt: '2026-09-20T09:35:00Z',
      updatedAt: '2026-09-20T09:40:00Z',
    },
  ];

  // Allocation: Project A17 -> Rahul Kumar with EDIT permission
  const initialAllocations: AssetAllocation[] = [
    {
      id: 'alc-001',
      assetId: 'AST-0017',
      assetName: 'Project A17',
      userId: 'usr-rahul-01',
      userDid: 'did:chainidentity:rahul123',
      userName: 'Rahul Kumar',
      role: 'EMPLOYEE',
      permissions: ['VIEW', 'EDIT'],
      allocatedBy: 'System Administrator',
      allocatedByDid: 'did:chainidentity:admin001',
      allocatedAt: '2026-09-20T09:15:00Z',
      status: 'ACTIVE',
    },
  ];

  // Ledger Hash Chain construction
  const ledger: LedgerEvent[] = [];

  function addBlock(
    eventType: LedgerEvent['eventType'],
    actorDid: string,
    assetId: string | undefined,
    payload: Record<string, any>,
    timestamp: string,
    forcedTxId?: string
  ) {
    const index = ledger.length;
    const previousHash = index === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : ledger[index - 1].currentHash;
    const eventId = `EVT-${String(index).padStart(5, '0')}-${crypto.randomBytes(3).toString('hex')}`;
    const transactionId = forcedTxId || generateTxId();
    const currentHash = computeBlockHash(index, timestamp, eventId, eventType, actorDid, assetId, transactionId, payload, previousHash);

    const block: LedgerEvent = {
      index,
      timestamp,
      eventId,
      eventType,
      actorDid,
      assetId,
      transactionId,
      payload,
      previousHash,
      currentHash,
      signature: 'ED25519_SIG_' + crypto.createHash('sha256').update(currentHash + actorDid).digest('hex').substring(0, 32),
    };
    ledger.push(block);
  }

  addBlock('GENESIS', 'did:chainidentity:bel-root-authority', undefined, {
    message: 'ChainIdentity Permissioned Ledger Initialized. Root: Bharat Electronics Limited (BEL)',
    consensus: 'Raft / PBFT Fabric Compatible Demo Engine',
    version: '2026.1.0-SIH26125',
  }, '2026-09-20T07:59:00Z', '0x0000000000000000000000000000000000000000000000000000000000000001');

  addBlock('DID_CREATED', 'did:chainidentity:admin001', undefined, {
    user: 'System Administrator',
    did: 'did:chainidentity:admin001',
    role: 'ADMINISTRATOR',
  }, '2026-09-20T08:00:00Z');

  addBlock('DID_CREATED', 'did:chainidentity:admin001', undefined, {
    user: 'Rahul Kumar',
    did: 'did:chainidentity:rahul123',
    email: 'rahul@chainidentity.demo',
  }, '2026-09-20T08:30:00Z');

  addBlock('ROLE_ASSIGNED', 'did:chainidentity:admin001', undefined, {
    targetDid: 'did:chainidentity:rahul123',
    role: 'EMPLOYEE',
    organization: 'BEL Defense Radar',
  }, '2026-09-20T08:32:00Z');

  addBlock('ASSET_REGISTERED', 'did:chainidentity:admin001', 'AST-0017', {
    name: 'Project A17',
    assetType: 'PROJECT',
    classification: 'CONFIDENTIAL',
  }, '2026-09-20T08:50:00Z');

  addBlock('ASSET_MINTED', 'did:chainidentity:admin001', 'AST-0017', {
    tokenId: 'NFT-AST-0017',
    sha256PayloadReference: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    standard: 'ChainIdentity-OrganizationalAssetToken-v1',
  }, '2026-09-20T09:00:00Z', '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');

  addBlock('ASSET_ALLOCATED', 'did:chainidentity:admin001', 'AST-0017', {
    assigneeDid: 'did:chainidentity:rahul123',
    assigneeName: 'Rahul Kumar',
    permissions: ['VIEW', 'EDIT'],
    status: 'ACTIVE',
  }, '2026-09-20T09:15:00Z');

  // Pre-seed mock encrypted off-chain storage data for Project A17
  const offchainDataSample = JSON.stringify({
    project: 'Project A17',
    classification: 'CONFIDENTIAL',
    securityClearance: 'LEVEL-2',
    payload: 'Tactical Signal Processing Algorithms & DSP Codebase. Authorized for Rahul Kumar (EDIT). Organization: Bharat Electronics Limited (BEL).',
    timestamp: '2026-09-20T09:00:00Z',
  });
  const sampleHash = crypto.createHash('sha256').update(offchainDataSample).digest('hex');
  const sampleIv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update('enc-key-bel-2026').digest(), sampleIv);
  let enc = cipher.update(offchainDataSample, 'utf8', 'hex');
  enc += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  const sampleFilePath = path.join(OFFCHAIN_DIR, 'ast-0017-payload.enc');
  fs.writeFileSync(sampleFilePath, enc, 'utf8');

  const offchainFiles: Record<string, OffchainFile> = {
    'offchain-ast-0017': {
      id: 'offchain-ast-0017',
      assetId: 'AST-0017',
      filename: 'Project-A17-Tactical-DSP-v3.pkg',
      mimeType: 'application/octet-stream',
      sizeBytes: offchainDataSample.length,
      sha256Hash: sampleHash,
      encryptedFilePath: sampleFilePath,
      ivHex: sampleIv.toString('hex'),
      authTagHex: authTag,
      uploadedByDid: 'did:chainidentity:admin001',
      uploadedAt: '2026-09-20T09:00:00Z',
      verifiedAt: '2026-09-20T09:00:00Z',
    },
  };

  const securityAlerts: SecurityAlert[] = [
    {
      id: 'ALT-INIT-001',
      anomalyScore: 24,
      riskLevel: 'LOW',
      reason: 'Routine baseline scan: access pattern verified across normal business hours.',
      userDid: 'did:chainidentity:rahul123',
      userName: 'Rahul Kumar',
      assetId: 'AST-0017',
      assetName: 'Project A17',
      details: {
        frequency: '1 request / hr',
        timeWindow: '09:00 - 17:00 IST',
        location: 'BEL Jalahalli Campus IP Range',
      },
      status: 'RESOLVED',
      createdAt: '2026-09-20T10:00:00Z',
      resolvedAt: '2026-09-20T10:05:00Z',
      investigatedBy: 'Vikram Joshi (SecOps)',
      investigationNotes: 'Verified as normal baseline activity during shift.',
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif-1',
      targetRole: 'EMPLOYEE',
      targetUserDid: 'did:chainidentity:rahul123',
      title: 'Asset Allocated: Project A17',
      message: 'You have been granted active EDIT permissions on Project A17 by Administrator.',
      type: 'SUCCESS',
      read: false,
      createdAt: '2026-09-20T09:15:00Z',
    },
    {
      id: 'notif-2',
      targetRole: 'SECURITY_MANAGER',
      title: 'System Initialized',
      message: 'ChainIdentity ledger online with tamper-evident SHA-256 hash chain and AI anomaly surveillance.',
      type: 'INFO',
      read: false,
      createdAt: '2026-09-20T08:00:00Z',
    },
  ];

  db = {
    users: initialUsers,
    dids,
    assets: initialAssets,
    allocations: initialAllocations,
    accessRequests: [],
    ledger,
    securityAlerts,
    emergencyAccesses: [],
    offchainFiles,
    notifications,
    blockchainProvider: 'local',
    ledgerTampered: false,
  };

  saveDatabase();
}

initDatabase();

// Express Application Setup
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serverless URL normalizer: ensure requests arriving with or without /api prefix reach the right route
app.use((req, res, next) => {
  if (req.url && !req.url.startsWith('/api') && req.url !== '/' && !req.url.startsWith('/assets') && !req.url.startsWith('/@') && !req.url.startsWith('/src')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Root API information endpoint
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'ChainIdentity Enterprise Platform',
    version: '2026.1.0-ENTERPRISE',
    blockchainProvider: db?.blockchainProvider || 'fabric',
    timestamp: new Date().toISOString()
  });
});

// Middleware: Authenticate JWT
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    (req as any).user = decoded;
    next();
  });
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: ${allowedRoles.join(', ')}. Current role: ${user?.role || 'NONE'}`,
      });
    }
    next();
  };
}

// Ledger append helper
export function appendLedgerEvent(
  eventType: LedgerEvent['eventType'],
  actorDid: string,
  assetId: string | undefined,
  payload: Record<string, any>
): LedgerEvent {
  const index = db.ledger.length;
  const previousHash = index === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : db.ledger[index - 1].currentHash;
  const timestamp = new Date().toISOString();
  const eventId = `EVT-${String(index).padStart(5, '0')}-${crypto.randomBytes(3).toString('hex')}`;
  const transactionId = generateTxId();
  const currentHash = computeBlockHash(index, timestamp, eventId, eventType, actorDid, assetId, transactionId, payload, previousHash);

  const block: LedgerEvent = {
    index,
    timestamp,
    eventId,
    eventType,
    actorDid,
    assetId,
    transactionId,
    payload,
    previousHash,
    currentHash,
    signature: 'ED25519_SIG_' + crypto.createHash('sha256').update(currentHash + actorDid).digest('hex').substring(0, 32),
  };

  db.ledger.push(block);
  saveDatabase();
  return block;
}

// AI Security Analytics Engine
function runAISecurityAnalytics(userDid: string, assetId?: string, isDenied: boolean = false) {
  const now = new Date();
  const currentHour = now.getHours(); // 0 - 23

  // Get recent ledger events for this user in last 10 minutes
  const recentEvents = db.ledger.filter((evt) => {
    const evtTime = new Date(evt.timestamp).getTime();
    return evt.actorDid === userDid && now.getTime() - evtTime < 10 * 60 * 1000;
  });

  const deniedCount = recentEvents.filter((e) => e.eventType === 'ACCESS_DENIED').length + (isDenied ? 1 : 0);
  const totalRecent = recentEvents.length + 1;

  let anomalyScore = 15;
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  const reasons: string[] = [];

  // Check off-hours (between 11 PM and 5 AM)
  const isOffHours = currentHour >= 23 || currentHour < 5;
  if (isOffHours) {
    anomalyScore += 45;
    reasons.push(`Unusual access time (${currentHour}:00 IST - Outside standard 08:00-18:00 operational window)`);
  }

  // Check frequency spike
  if (totalRecent >= 6) {
    anomalyScore += 40;
    reasons.push(`Unusually high request frequency detected (${totalRecent} operations within last 10 minutes)`);
  } else if (totalRecent >= 3) {
    anomalyScore += 15;
  }

  // Check repeated denied requests
  if (deniedCount >= 2) {
    anomalyScore += 35;
    reasons.push(`Repeated denied authorization attempts (${deniedCount} denied requests on protected organizational assets)`);
  }

  anomalyScore = Math.min(100, Math.max(5, anomalyScore));

  if (anomalyScore >= 70) {
    riskLevel = 'HIGH';
  } else if (anomalyScore >= 40) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  const user = db.users.find((u) => u.did === userDid);
  const asset = assetId ? db.assets.find((a) => a.assetId === assetId) : undefined;

  // If high risk or medium risk with denied attempts, log SECURITY_ALERT
  if (riskLevel === 'HIGH' || (riskLevel === 'MEDIUM' && deniedCount >= 2)) {
    const alertId = `ALT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const alertReason = reasons.join('; ');

    const alert: SecurityAlert = {
      id: alertId,
      anomalyScore,
      riskLevel,
      reason: alertReason,
      userDid,
      userName: user?.name || 'Unknown Subject',
      assetId,
      assetName: asset?.name,
      details: {
        totalEventsLast10Min: totalRecent,
        deniedCount,
        accessHour: currentHour,
        evaluatedAt: now.toISOString(),
      },
      status: 'UNRESOLVED',
      createdAt: now.toISOString(),
    };

    db.securityAlerts.unshift(alert);

    // Record on ledger
    appendLedgerEvent('SECURITY_ALERT', 'did:chainidentity:ai-security-daemon', assetId, {
      alertId,
      riskLevel,
      anomalyScore,
      targetUserDid: userDid,
      reason: alertReason,
      actionRequired: 'Human Security Manager Investigation Required',
    });

    // Notify Security Managers
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      targetRole: 'SECURITY_MANAGER',
      title: `SECURITY ALERT: ${riskLevel} Risk Detected`,
      message: `${alertReason} for ${user?.name || userDid}. Investigation required.`,
      type: 'DANGER',
      read: false,
      createdAt: now.toISOString(),
      link: '/security/alerts',
    });

    saveDatabase();
    return alert;
  }

  return { anomalyScore, riskLevel, reason: reasons.join('; ') || 'Normal baseline activity' };
}

// SMART CONTRACT & POLICY SERVICE
// Core principle: AI analyzes and alerts; smart contract / policy engine remains the authorization enforcement layer!
export function checkAccess(userDid: string, role: string, assetId: string, requestedAction: string): {
  allowed: boolean;
  reason: string;
  allocation?: AssetAllocation;
  emergencyActive?: boolean;
} {
  // 1. Check user status
  const user = db.users.find((u) => u.did === userDid);
  if (!user || user.status !== 'ACTIVE') {
    return { allowed: false, reason: 'User account is inactive or not found' };
  }

  // 2. Administrators always allowed for governance actions
  if (role === 'ADMINISTRATOR') {
    return { allowed: true, reason: 'Administrator broad management clearance' };
  }

  // 3. Check Emergency Break-glass Access
  const now = new Date();
  const emergency = db.emergencyAccesses.find(
    (e) => e.userDid === userDid && e.assetId === assetId && e.status === 'ACTIVE' && new Date(e.expiryTime) > now
  );
  if (emergency) {
    return {
      allowed: true,
      reason: `Emergency Break-Glass active (Authorized by ${emergency.approvedBy}: "${emergency.reason}")`,
      emergencyActive: true,
    };
  }

  // 4. Check Asset Allocations
  const allocation = db.allocations.find((a) => a.assetId === assetId && a.userDid === userDid);

  if (!allocation) {
    return { allowed: false, reason: 'No asset allocation or authorization grant found for this DID' };
  }

  // If allocation was revoked
  if (allocation.status === 'REVOKED') {
    return {
      allowed: false,
      reason: `Permission revoked. ${allocation.revocationReason ? `Reason: "${allocation.revocationReason}". ` : ''}Revoked on ${new Date(
        allocation.revokedAt || ''
      ).toLocaleString()} by ${allocation.revokedBy || 'Security Manager'}.`,
      allocation,
    };
  }

  if (allocation.status === 'EXPIRED') {
    return { allowed: false, reason: 'Asset allocation grant has expired', allocation };
  }

  // Check action permission
  const actionUpper = requestedAction.toUpperCase() as any;
  if (!allocation.permissions.includes(actionUpper)) {
    return {
      allowed: false,
      reason: `Insufficient permission for action "${requestedAction}". Active permissions: [${allocation.permissions.join(', ')}]`,
      allocation,
    };
  }

  return { allowed: true, reason: 'Permission verified and active under Smart Contract Policy', allocation };
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'ChainIdentity Enterprise Platform',
    version: '2026.1.0-ENTERPRISE',
    organization: 'Enterprise Defense Division',
    blockchainProvider: db.blockchainProvider,
    totalBlocks: db.ledger.length,
    timestamp: new Date().toISOString(),
  });
});

// AUTH
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or credentials' });
  }

  const passwordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: `Account status is ${user.status}` });
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      did: user.did,
      role: user.role,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      did: user.did,
      role: user.role,
      department: user.department,
      organization: user.organization,
      status: user.status,
    },
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const tokenUser = (req as any).user;
  const user = db.users.find((u) => u.id === tokenUser.id);
  if (!user) {
    return res.status(404).json({ error: 'User record not found' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    did: user.did,
    role: user.role,
    department: user.department,
    organization: user.organization,
    status: user.status,
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// USERS & DIDS
app.get('/api/users', authenticateToken, (req, res) => {
  const safeUsers = db.users.map(({ passwordHash, ...safe }) => safe);
  res.json(safeUsers);
});

app.post('/api/users', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const { name, email, password, role, department, organization, customDidSuffix } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const cleanSuffix = (customDidSuffix || name.toLowerCase().replace(/[^a-z0-9]/g, '')).slice(0, 20);
  const did = `did:chainidentity:${cleanSuffix}`;

  if (db.dids[did]) {
    return res.status(400).json({ error: `DID ${did} is already registered. Please specify a unique identifier.` });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password || 'demo1234', salt);
  const now = new Date().toISOString();

  const newUser: User = {
    id: `usr-${Date.now().toString(36)}`,
    name,
    email,
    passwordHash,
    did,
    role,
    department: department || 'BEL Engineering Division',
    organization: organization || 'Bharat Electronics Limited (BEL)',
    status: 'ACTIVE',
    createdAt: now,
  };

  db.users.push(newUser);

  // Generate W3C DID Document
  const didDoc: DIDDocument = {
    id: did,
    controller: 'did:chainidentity:bel-root-authority',
    verificationMethod: [
      {
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: 'z' + crypto.createHash('sha256').update(did + now).digest('hex').substring(0, 44),
      },
    ],
    authentication: [`${did}#key-1`],
    service: [
      {
        id: `${did}#chainidentity-agent`,
        type: 'ChainIdentityDecentralizedAgent',
        serviceEndpoint: 'https://chainidentity.bel.in/did-resolver/v1',
      },
    ],
    created: now,
    updated: now,
  };
  db.dids[did] = didDoc;

  // Blockchain Ledger record: DID_CREATED
  const creatorDid = (req as any).user.did;
  appendLedgerEvent('DID_CREATED', creatorDid, undefined, {
    createdUserDid: did,
    userName: name,
    userEmail: email,
    initialRole: role,
    didDocumentHash: crypto.createHash('sha256').update(JSON.stringify(didDoc)).digest('hex'),
  });

  // Blockchain Ledger record: ROLE_ASSIGNED
  appendLedgerEvent('ROLE_ASSIGNED', creatorDid, undefined, {
    targetDid: did,
    assignedRole: role,
    assignedBy: (req as any).user.name,
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'ADMINISTRATOR',
    title: 'New Identity Registered',
    message: `Generated DID ${did} for ${name} (${role})`,
    type: 'SUCCESS',
    read: false,
    createdAt: now,
  });

  saveDatabase();

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, didDocument: didDoc });
});

app.get('/api/dids/:did', authenticateToken, (req, res) => {
  const { did } = req.params;
  const doc = db.dids[did];
  if (!doc) {
    return res.status(404).json({ error: 'DID document not found' });
  }
  const user = db.users.find((u) => u.did === did);
  res.json({
    didDocument: doc,
    userMetadata: user ? {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      organization: user.organization,
      status: user.status,
    } : null,
  });
});

app.post('/api/users/:id/roles', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const oldRole = user.role;
  user.role = role;

  appendLedgerEvent('ROLE_ASSIGNED', (req as any).user.did, undefined, {
    targetDid: user.did,
    previousRole: oldRole,
    newRole: role,
    assignedBy: (req as any).user.name,
  });

  saveDatabase();
  res.json({ message: `Role updated to ${role}`, user });
});

// ASSETS
app.get('/api/assets', authenticateToken, (req, res) => {
  res.json(db.assets);
});

app.get('/api/assets/:id', authenticateToken, (req, res) => {
  const asset = db.assets.find((a) => a.id === req.params.id || a.assetId === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  const allocations = db.allocations.filter((alc) => alc.assetId === asset.assetId);
  const events = db.ledger.filter((evt) => evt.assetId === asset.assetId);
  const offchainFile = asset.offchainId ? db.offchainFiles[asset.offchainId] : null;

  res.json({
    asset,
    allocations,
    events,
    offchainFile: offchainFile ? {
      filename: offchainFile.filename,
      mimeType: offchainFile.mimeType,
      sizeBytes: offchainFile.sizeBytes,
      sha256Hash: offchainFile.sha256Hash,
      uploadedAt: offchainFile.uploadedAt,
    } : null,
  });
});

app.post('/api/assets', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const { assetId, name, description, assetType, classification } = req.body;
  if (!assetId || !name || !assetType || !classification) {
    return res.status(400).json({ error: 'assetId, name, assetType, and classification are required' });
  }

  if (db.assets.some((a) => a.assetId.toUpperCase() === assetId.toUpperCase())) {
    return res.status(400).json({ error: `Asset ID ${assetId} already exists` });
  }

  const tokenId = `NFT-${assetId.toUpperCase()}`;
  const now = new Date().toISOString();
  const actorDid = (req as any).user.did;

  const newAsset: DigitalAsset = {
    id: `ast-${Date.now().toString(36)}`,
    assetId: assetId.toUpperCase(),
    tokenId,
    name,
    description: description || '',
    assetType,
    classification,
    owner: 'Bharat Electronics Limited (BEL)',
    ownerDid: actorDid,
    isTokenized: false,
    status: 'REGISTERED',
    createdAt: now,
    updatedAt: now,
  };

  db.assets.push(newAsset);

  appendLedgerEvent('ASSET_REGISTERED', actorDid, newAsset.assetId, {
    name,
    assetType,
    classification,
    registeredBy: (req as any).user.name,
  });

  saveDatabase();
  res.status(201).json(newAsset);
});

// TOKENIZE ASSET (MINT NFT)
app.post('/api/assets/:id/tokenize', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const asset = db.assets.find((a) => a.id === req.params.id || a.assetId === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  if (asset.isTokenized) {
    return res.status(400).json({ error: 'Asset is already tokenized with token ID ' + asset.tokenId });
  }

  const now = new Date().toISOString();
  const actorDid = (req as any).user.did;
  const txId = generateTxId();

  asset.isTokenized = true;
  asset.mintTransactionId = txId;
  asset.mintTimestamp = now;
  asset.status = 'TOKENIZED';
  asset.updatedAt = now;

  const block = appendLedgerEvent('ASSET_MINTED', actorDid, asset.assetId, {
    tokenId: asset.tokenId,
    name: asset.name,
    classification: asset.classification,
    tokenStandard: 'ChainIdentity-OrganizationalAssetToken-v1',
    immutableOwnership: 'Bharat Electronics Limited (BEL)',
  });

  saveDatabase();
  res.json({
    message: 'Asset successfully tokenized on blockchain ledger',
    asset,
    transaction: {
      transactionId: txId,
      blockIndex: block.index,
      blockHash: block.currentHash,
      timestamp: now,
    },
  });
});

// ALLOCATE ASSET
app.post('/api/assets/:id/allocate', authenticateToken, requireRole(['ADMINISTRATOR', 'SECURITY_MANAGER']), (req, res) => {
  const { userDid, permissions } = req.body;
  if (!userDid || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return res.status(400).json({ error: 'userDid and array of permissions are required' });
  }

  const asset = db.assets.find((a) => a.id === req.params.id || a.assetId === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const targetUser = db.users.find((u) => u.did === userDid);
  if (!targetUser) {
    return res.status(404).json({ error: 'Assignee user not found for DID ' + userDid });
  }

  // Check if existing active allocation exists
  let existing = db.allocations.find((a) => a.assetId === asset.assetId && a.userDid === userDid);
  const now = new Date().toISOString();
  const actor = (req as any).user;

  if (existing) {
    existing.status = 'ACTIVE';
    existing.permissions = permissions;
    existing.allocatedBy = actor.name;
    existing.allocatedByDid = actor.did;
    existing.allocatedAt = now;
    delete existing.revokedAt;
    delete existing.revokedBy;
    delete existing.revocationReason;
  } else {
    existing = {
      id: `alc-${Date.now().toString(36)}`,
      assetId: asset.assetId,
      assetName: asset.name,
      userId: targetUser.id,
      userDid: targetUser.did,
      userName: targetUser.name,
      role: targetUser.role,
      permissions,
      allocatedBy: actor.name,
      allocatedByDid: actor.did,
      allocatedAt: now,
      status: 'ACTIVE',
    };
    db.allocations.push(existing);
  }

  asset.status = 'ALLOCATED';
  asset.updatedAt = now;

  const block = appendLedgerEvent('ASSET_ALLOCATED', actor.did, asset.assetId, {
    allocationId: existing.id,
    assigneeDid: targetUser.did,
    assigneeName: targetUser.name,
    permissions,
    allocatedBy: actor.name,
    status: 'ACTIVE',
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetUserDid: targetUser.did,
    title: `Asset Allocated: ${asset.name}`,
    message: `You have been allocated [${permissions.join(', ')}] access on ${asset.name} (${asset.assetId}).`,
    type: 'SUCCESS',
    read: false,
    createdAt: now,
  });

  saveDatabase();
  res.json({
    message: 'Asset successfully allocated',
    allocation: existing,
    transaction: {
      transactionId: block.transactionId,
      blockHash: block.currentHash,
      timestamp: now,
    },
  });
});

// REVOKE PERMISSION / ALLOCATION (Security Manager or Admin)
app.post('/api/assets/:id/revoke', authenticateToken, requireRole(['ADMINISTRATOR', 'SECURITY_MANAGER']), (req, res) => {
  const { userDid, reason } = req.body;
  if (!userDid) {
    return res.status(400).json({ error: 'userDid is required' });
  }

  const asset = db.assets.find((a) => a.id === req.params.id || a.assetId === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const allocation = db.allocations.find((a) => a.assetId === asset.assetId && a.userDid === userDid);
  if (!allocation) {
    return res.status(404).json({ error: 'No active allocation found for this user and asset' });
  }

  const actor = (req as any).user;
  const now = new Date().toISOString();
  const revocationReason = reason || 'Revocation by Security Officer policy decision';

  allocation.status = 'REVOKED';
  allocation.revokedAt = now;
  allocation.revokedBy = actor.name;
  allocation.revocationReason = revocationReason;

  const block = appendLedgerEvent('PERMISSION_REVOKED', actor.did, asset.assetId, {
    allocationId: allocation.id,
    revokedUserDid: userDid,
    revokedUserName: allocation.userName,
    previousPermissions: allocation.permissions,
    revokedBy: actor.name,
    reason: revocationReason,
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetUserDid: userDid,
    title: `Permissions Revoked: ${asset.name}`,
    message: `Your access to ${asset.name} has been revoked by ${actor.name}. Reason: ${revocationReason}`,
    type: 'DANGER',
    read: false,
    createdAt: now,
  });

  saveDatabase();
  res.json({
    message: `Successfully revoked permissions for ${allocation.userName} on ${asset.name}`,
    allocation,
    transaction: {
      transactionId: block.transactionId,
      blockHash: block.currentHash,
      timestamp: now,
    },
  });
});

// ACCESS REQUESTS (Employee submits, Security Manager decides)
app.get('/api/access-requests', authenticateToken, (req, res) => {
  const user = (req as any).user;
  if (user.role === 'EMPLOYEE') {
    return res.json(db.accessRequests.filter((r) => r.userDid === user.did));
  }
  res.json(db.accessRequests);
});

app.post('/api/access-requests', authenticateToken, (req, res) => {
  const { assetId, action, reason, durationHours } = req.body;
  if (!assetId || !action || !reason) {
    return res.status(400).json({ error: 'assetId, action, and reason are required' });
  }

  const asset = db.assets.find((a) => a.assetId === assetId || a.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const user = (req as any).user;
  const now = new Date().toISOString();

  const accessReq: AccessRequest = {
    id: `req-${Date.now().toString(36)}`,
    assetId: asset.assetId,
    assetName: asset.name,
    userId: user.id,
    userDid: user.did,
    userName: user.name,
    userRole: user.role,
    action: action.toUpperCase(),
    reason,
    durationHours: Number(durationHours) || 24,
    status: 'PENDING',
    requestedAt: now,
  };

  db.accessRequests.unshift(accessReq);

  const block = appendLedgerEvent('ACCESS_REQUESTED', user.did, asset.assetId, {
    requestId: accessReq.id,
    action: accessReq.action,
    reason,
    durationHours: accessReq.durationHours,
  });

  accessReq.transactionId = block.transactionId;

  // Run AI analytics on request pattern
  runAISecurityAnalytics(user.did, asset.assetId, false);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'SECURITY_MANAGER',
    title: 'New Access Request',
    message: `${user.name} requested ${accessReq.action} on ${asset.name}`,
    type: 'INFO',
    read: false,
    createdAt: now,
    link: '/security/requests',
  });

  saveDatabase();
  res.status(201).json(accessReq);
});

app.post('/api/access-requests/:id/approve', authenticateToken, requireRole(['SECURITY_MANAGER', 'ADMINISTRATOR']), (req, res) => {
  const { id } = req.params;
  const accessReq = db.accessRequests.find((r) => r.id === id);
  if (!accessReq) {
    return res.status(404).json({ error: 'Access request not found' });
  }

  const actor = (req as any).user;
  const now = new Date().toISOString();

  accessReq.status = 'APPROVED';
  accessReq.decidedAt = now;
  accessReq.decidedBy = actor.name;

  // Update or create allocation
  let alloc = db.allocations.find((a) => a.assetId === accessReq.assetId && a.userDid === accessReq.userDid);
  if (alloc) {
    alloc.status = 'ACTIVE';
    if (!alloc.permissions.includes(accessReq.action as any)) {
      alloc.permissions.push(accessReq.action as any);
    }
  } else {
    alloc = {
      id: `alc-${Date.now().toString(36)}`,
      assetId: accessReq.assetId,
      assetName: accessReq.assetName,
      userId: accessReq.userId,
      userDid: accessReq.userDid,
      userName: accessReq.userName,
      role: accessReq.userRole,
      permissions: [accessReq.action as any],
      allocatedBy: actor.name,
      allocatedByDid: actor.did,
      allocatedAt: now,
      status: 'ACTIVE',
    };
    db.allocations.push(alloc);
  }

  const block = appendLedgerEvent('ACCESS_ALLOWED', actor.did, accessReq.assetId, {
    requestId: accessReq.id,
    targetDid: accessReq.userDid,
    action: accessReq.action,
    approvedBy: actor.name,
    smartContractDecision: 'ALLOW',
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetUserDid: accessReq.userDid,
    title: 'Access Request Approved',
    message: `Your request for ${accessReq.action} on ${accessReq.assetName} was approved.`,
    type: 'SUCCESS',
    read: false,
    createdAt: now,
  });

  saveDatabase();
  res.json({ message: 'Access request approved', request: accessReq, blockHash: block.currentHash });
});

app.post('/api/access-requests/:id/deny', authenticateToken, requireRole(['SECURITY_MANAGER', 'ADMINISTRATOR']), (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const accessReq = db.accessRequests.find((r) => r.id === id);
  if (!accessReq) {
    return res.status(404).json({ error: 'Access request not found' });
  }

  const actor = (req as any).user;
  const now = new Date().toISOString();

  accessReq.status = 'DENIED';
  accessReq.decidedAt = now;
  accessReq.decidedBy = actor.name;
  accessReq.decisionReason = reason || 'Denied under security policy evaluation';

  const block = appendLedgerEvent('ACCESS_DENIED', actor.did, accessReq.assetId, {
    requestId: accessReq.id,
    targetDid: accessReq.userDid,
    action: accessReq.action,
    deniedBy: actor.name,
    reason: accessReq.decisionReason,
    smartContractDecision: 'DENY',
  });

  runAISecurityAnalytics(accessReq.userDid, accessReq.assetId, true);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetUserDid: accessReq.userDid,
    title: 'Access Request Denied',
    message: `Your request for ${accessReq.action} on ${accessReq.assetName} was denied: ${accessReq.decisionReason}`,
    type: 'DANGER',
    read: false,
    createdAt: now,
  });

  saveDatabase();
  res.json({ message: 'Access request denied', request: accessReq, blockHash: block.currentHash });
});

// EXECUTE ASSET ACTION (Live Smart Contract / Policy check!)
// This is the core demo test endpoint: Rahul tries to perform action (e.g. EDIT)
// If permission active -> ALLOW & ACCESS_ALLOWED ledger record
// If revoked -> DENY & ACCESS_DENIED ledger record
app.post('/api/assets/:id/execute-action', authenticateToken, (req, res) => {
  const { action } = req.body;
  const asset = db.assets.find((a) => a.id === req.params.id || a.assetId === req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const user = (req as any).user;
  const requestedAction = (action || 'EDIT').toUpperCase();

  // SMART CONTRACT ENFORCEMENT
  const policyResult = checkAccess(user.did, user.role, asset.assetId, requestedAction);

  if (policyResult.allowed) {
    // Record ACCESS_ALLOWED on blockchain
    const block = appendLedgerEvent('ACCESS_ALLOWED', user.did, asset.assetId, {
      action: requestedAction,
      enforcementLayer: 'SmartContractService::check_access',
      policyResult: 'ALLOW',
      reason: policyResult.reason,
      emergencyActive: !!policyResult.emergencyActive,
    });

    // Run AI security analytics
    const aiAnalysis = runAISecurityAnalytics(user.did, asset.assetId, false);

    saveDatabase();
    return res.json({
      decision: 'ALLOW',
      allowed: true,
      reason: policyResult.reason,
      transactionId: block.transactionId,
      blockHash: block.currentHash,
      timestamp: block.timestamp,
      aiAnalysis,
    });
  } else {
    // Record ACCESS_DENIED on blockchain
    const block = appendLedgerEvent('ACCESS_DENIED', user.did, asset.assetId, {
      action: requestedAction,
      enforcementLayer: 'SmartContractService::check_access',
      policyResult: 'DENY',
      reason: policyResult.reason,
    });

    // Run AI security analytics on denied event
    const aiAnalysis = runAISecurityAnalytics(user.did, asset.assetId, true);

    saveDatabase();
    return res.status(403).json({
      decision: 'DENY',
      allowed: false,
      reason: policyResult.reason,
      transactionId: block.transactionId,
      blockHash: block.currentHash,
      timestamp: block.timestamp,
      aiAnalysis,
    });
  }
});

// SIMULATE SUSPICIOUS ACTIVITY (SIH Demo Scenario Step 8)
// Generates rapid requests or off-hours burst to demonstrate AI Anomaly Detection & Alert creation
app.post('/api/security/simulate-anomaly', authenticateToken, (req, res) => {
  const { userDid, assetId, scenario } = req.body;
  const targetUserDid = userDid || 'did:chainidentity:rahul123';
  const targetAssetId = assetId || 'AST-0017';
  const targetUser = db.users.find((u) => u.did === targetUserDid);
  const targetAsset = db.assets.find((a) => a.assetId === targetAssetId);

  const now = new Date();

  // Create 5 rapid denied access events simulating a brute-force / off-hours breach attempt
  for (let i = 0; i < 5; i++) {
    appendLedgerEvent('ACCESS_DENIED', targetUserDid, targetAssetId, {
      action: 'EDIT',
      reason: 'Permission revoked or invalid cryptographic token',
      simulatedBreachAttempt: true,
      burstSequence: i + 1,
      attemptTime: '02:0' + (i * 2) + ':15 IST (Off-hours)',
    });
  }

  // Generate the HIGH RISK AI alert
  const alertId = `ALT-SIH-${Date.now().toString(36).toUpperCase()}`;
  const alert: SecurityAlert = {
    id: alertId,
    anomalyScore: 94,
    riskLevel: 'HIGH',
    reason: 'Unusual access frequency (5 rapid unauthorized requests) outside working hours (02:00 AM - 02:10 AM IST) on CONFIDENTIAL defense asset',
    userDid: targetUserDid,
    userName: targetUser?.name || 'Rahul Kumar',
    assetId: targetAssetId,
    assetName: targetAsset?.name || 'Project A17',
    details: {
      burstVolume: '5 failed authorization events in 180 seconds',
      timeWindow: '02:00 AM - 02:10 AM IST',
      offHoursViolation: true,
      repeatedDenials: true,
      targetClassification: 'CONFIDENTIAL',
      deviceFingerprint: 'Unrecognized Client Fingerprint (IP: 192.168.45.102)',
    },
    status: 'UNRESOLVED',
    createdAt: new Date().toISOString(),
  };

  db.securityAlerts.unshift(alert);

  appendLedgerEvent('SECURITY_ALERT', 'did:chainidentity:ai-security-engine', targetAssetId, {
    alertId,
    riskLevel: 'HIGH',
    anomalyScore: 94,
    targetUserDid,
    reason: alert.reason,
    policyEnforcementIntegrity: 'Smart contract successfully rejected unauthorized access; human investigation recommended.',
  });

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    targetRole: 'SECURITY_MANAGER',
    title: 'HIGH RISK AI SECURITY ALERT',
    message: `Anomaly detected: 5 rapid denied requests at 02:00 AM by ${targetUser?.name || targetUserDid} on ${targetAsset?.name || targetAssetId}.`,
    type: 'DANGER',
    read: false,
    createdAt: new Date().toISOString(),
    link: '/security/alerts',
  });

  saveDatabase();
  res.json({
    message: 'Simulated breach activity successfully executed and analyzed by AI daemon.',
    alert,
  });
});

// BLOCKCHAIN AUDIT & INTEGRITY RECALCULATION
app.get('/api/audit', authenticateToken, (req, res) => {
  const { eventType, userDid, assetId, limit } = req.query;
  let events = [...db.ledger];

  if (eventType) {
    events = events.filter((e) => e.eventType === eventType);
  }
  if (userDid) {
    events = events.filter((e) => e.actorDid === userDid || e.payload?.targetDid === userDid || e.payload?.assigneeDid === userDid);
  }
  if (assetId) {
    events = events.filter((e) => e.assetId === assetId);
  }

  // Reverse so newest first
  events.reverse();

  if (limit) {
    events = events.slice(0, Number(limit));
  }

  res.json({
    blockchainProvider: db.blockchainProvider,
    totalBlocks: db.ledger.length,
    tampered: db.ledgerTampered,
    events,
  });
});

// VERIFY INTEGRITY (Recalculate complete SHA-256 hash chain)
app.post('/api/audit/verify', authenticateToken, (req, res) => {
  let integrityVerified = true;
  let failureIndex = -1;
  let failureReason = '';

  for (let i = 0; i < db.ledger.length; i++) {
    const block = db.ledger[i];

    // Check previous hash link
    if (i === 0) {
      if (block.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        integrityVerified = false;
        failureIndex = 0;
        failureReason = 'Genesis block previous hash is corrupt';
        break;
      }
    } else {
      const prevBlock = db.ledger[i - 1];
      if (block.previousHash !== prevBlock.currentHash) {
        integrityVerified = false;
        failureIndex = i;
        failureReason = `Block #${i} previousHash (${block.previousHash.slice(0, 16)}...) does not match Block #${i - 1} currentHash (${prevBlock.currentHash.slice(0, 16)}...)`;
        break;
      }
    }

    // Recalculate block's currentHash
    const recalculated = computeBlockHash(
      block.index,
      block.timestamp,
      block.eventId,
      block.eventType,
      block.actorDid,
      block.assetId,
      block.transactionId,
      block.payload,
      block.previousHash
    );

    if (recalculated !== block.currentHash) {
      integrityVerified = false;
      failureIndex = i;
      failureReason = `Block #${i} hash mismatch! Computed: ${recalculated.slice(0, 16)}... vs Stored: ${block.currentHash.slice(0, 16)}... Data has been altered!`;
      break;
    }
  }

  res.json({
    status: integrityVerified ? 'INTEGRITY_VERIFIED' : 'INTEGRITY_FAILURE',
    verified: integrityVerified,
    message: integrityVerified
      ? 'All blocks in the chain have been cryptographically verified against SHA-256 parent hash tree.'
      : `Ledger integrity failure detected at block #${failureIndex}: ${failureReason}`,
    totalBlocksChecked: db.ledger.length,
    failureIndex: failureIndex >= 0 ? failureIndex : null,
    failureReason: failureReason || null,
    provider: db.blockchainProvider === 'local' ? 'Demo Ledger (Local Tamper-Evident SHA-256 Hash Chain)' : 'Hyperledger Fabric Adapter',
    genesisHash: db.ledger[0]?.currentHash,
    latestBlockHash: db.ledger[db.ledger.length - 1]?.currentHash,
    checkedAt: new Date().toISOString(),
  });
});

// SIMULATE TAMPER (for demo testing integrity failure detection)
app.post('/api/audit/simulate-tamper', authenticateToken, requireRole(['ADMINISTRATOR', 'SECURITY_MANAGER']), (req, res) => {
  if (db.ledger.length > 2) {
    const targetBlock = db.ledger[2];
    targetBlock.payload.corruptedField = 'MALICIOUS_ALTERATION_ATTEMPT';
    db.ledgerTampered = true;
    saveDatabase();
    res.json({ message: 'Ledger Block #2 was deliberately tampered with to test cryptographic verification.', blockIndex: 2 });
  } else {
    res.status(400).json({ error: 'Not enough blocks in ledger' });
  }
});

// REPAIR TAMPER / RESET LEDGER
app.post('/api/audit/repair-ledger', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  // Recompute hash chain from root
  for (let i = 0; i < db.ledger.length; i++) {
    const prevHash = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : db.ledger[i - 1].currentHash;
    db.ledger[i].previousHash = prevHash;
    if (db.ledger[i].payload.corruptedField) {
      delete db.ledger[i].payload.corruptedField;
    }
    db.ledger[i].currentHash = computeBlockHash(
      db.ledger[i].index,
      db.ledger[i].timestamp,
      db.ledger[i].eventId,
      db.ledger[i].eventType,
      db.ledger[i].actorDid,
      db.ledger[i].assetId,
      db.ledger[i].transactionId,
      db.ledger[i].payload,
      prevHash
    );
  }
  db.ledgerTampered = false;
  saveDatabase();
  res.json({ message: 'Ledger cryptographic hash chain repaired and re-anchored to Genesis root.', verified: true });
});

// SWITCH BLOCKCHAIN PROVIDER (Demo Ledger vs Hyperledger Fabric Adapter)
app.post('/api/blockchain/provider', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const { provider } = req.body;
  if (provider !== 'local' && provider !== 'fabric') {
    return res.status(400).json({ error: 'Provider must be "local" or "fabric"' });
  }
  db.blockchainProvider = provider;
  saveDatabase();
  res.json({
    message: `Active blockchain provider switched to ${provider === 'fabric' ? 'Hyperledger Fabric Adapter' : 'Demo Ledger (Local Tamper-Evident Hash Chain)'}`,
    blockchainProvider: db.blockchainProvider,
  });
});

// AI SECURITY ALERTS
app.get('/api/security/alerts', authenticateToken, (req, res) => {
  res.json(db.securityAlerts);
});

app.get('/api/security/analytics', authenticateToken, (req, res) => {
  const totalAnalyzed = db.ledger.length;
  const highRiskCount = db.securityAlerts.filter((a) => a.riskLevel === 'HIGH').length;
  const mediumRiskCount = db.securityAlerts.filter((a) => a.riskLevel === 'MEDIUM').length;
  const lowRiskCount = db.securityAlerts.filter((a) => a.riskLevel === 'LOW').length;

  const deniedCount = db.ledger.filter((e) => e.eventType === 'ACCESS_DENIED').length;
  const allowedCount = db.ledger.filter((e) => e.eventType === 'ACCESS_ALLOWED').length;

  res.json({
    totalAnalyzed,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    deniedCount,
    allowedCount,
    unresolvedAlerts: db.securityAlerts.filter((a) => a.status === 'UNRESOLVED').length,
    recentAlerts: db.securityAlerts.slice(0, 10),
  });
});

app.post('/api/security/alerts/:id/investigate', authenticateToken, requireRole(['SECURITY_MANAGER', 'ADMINISTRATOR']), (req, res) => {
  const { id } = req.params;
  const { notes, status } = req.body;
  const alert = db.securityAlerts.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: 'Security alert not found' });
  }

  const actor = (req as any).user;
  alert.status = status || 'INVESTIGATING';
  alert.investigatedBy = actor.name;
  if (notes) {
    alert.investigationNotes = notes;
  }
  if (status === 'RESOLVED') {
    alert.resolvedAt = new Date().toISOString();
  }

  // Get full audit trace for the user and asset involved
  const userAudit = db.ledger.filter((e) => e.actorDid === alert.userDid);
  const assetAudit = alert.assetId ? db.ledger.filter((e) => e.assetId === alert.assetId) : [];

  saveDatabase();
  res.json({
    alert,
    investigationContext: {
      userAuditCount: userAudit.length,
      assetAuditCount: assetAudit.length,
      userRecentEvents: userAudit.slice(-10),
      assetRecentEvents: assetAudit.slice(-10),
    },
  });
});

// EMERGENCY BREAK-GLASS ACCESS
app.post('/api/emergency-access', authenticateToken, requireRole(['SECURITY_MANAGER']), (req, res) => {
  const { userDid, assetId, reason, durationMinutes } = req.body;
  if (!userDid || !assetId || !reason) {
    return res.status(400).json({ error: 'userDid, assetId, and reason are required for emergency break-glass' });
  }

  const asset = db.assets.find((a) => a.assetId === assetId || a.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const targetUser = db.users.find((u) => u.did === userDid);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const actor = (req as any).user;
  const now = new Date();
  const dur = Number(durationMinutes) || 60;
  const expiry = new Date(now.getTime() + dur * 60 * 1000);

  const block = appendLedgerEvent('EMERGENCY_ACCESS', actor.did, asset.assetId, {
    action: 'BREAK_GLASS_AUTHORIZED',
    targetUserDid: userDid,
    targetUserName: targetUser.name,
    approvedBy: actor.name,
    reason,
    durationMinutes: dur,
    expiryTime: expiry.toISOString(),
  });

  const emergency: EmergencyAccess = {
    id: `emg-${Date.now().toString(36)}`,
    userId: targetUser.id,
    userDid: targetUser.did,
    userName: targetUser.name,
    assetId: asset.assetId,
    assetName: asset.name,
    reason,
    durationMinutes: dur,
    approvedBy: actor.name,
    approvedByDid: actor.did,
    startTime: now.toISOString(),
    expiryTime: expiry.toISOString(),
    status: 'ACTIVE',
    transactionId: block.transactionId,
  };

  db.emergencyAccesses.unshift(emergency);

  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'EMERGENCY BREAK-GLASS GRANTED',
    message: `Emergency access granted to ${targetUser.name} on ${asset.name}. Valid for ${dur} minutes.`,
    type: 'WARNING',
    read: false,
    createdAt: now.toISOString(),
  });

  saveDatabase();
  res.status(201).json(emergency);
});

app.post('/api/emergency-access/:id/revoke', authenticateToken, requireRole(['SECURITY_MANAGER', 'ADMINISTRATOR']), (req, res) => {
  const { id } = req.params;
  const emg = db.emergencyAccesses.find((e) => e.id === id);
  if (!emg) {
    return res.status(404).json({ error: 'Emergency access record not found' });
  }

  emg.status = 'REVOKED';
  const actor = (req as any).user;

  appendLedgerEvent('PERMISSION_REVOKED', actor.did, emg.assetId, {
    action: 'EMERGENCY_ACCESS_REVOKED',
    emergencyId: emg.id,
    targetUserDid: emg.userDid,
    revokedBy: actor.name,
  });

  saveDatabase();
  res.json({ message: 'Emergency access revoked', emergency: emg });
});

// OFF-CHAIN ENCRYPTED STORAGE (Upload, Download, Verify SHA-256 Hash)
app.post('/api/storage/upload', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  const { assetId, filename, contentBase64, mimeType } = req.body;
  if (!assetId || !filename || !contentBase64) {
    return res.status(400).json({ error: 'assetId, filename, and contentBase64 are required' });
  }

  const asset = db.assets.find((a) => a.assetId === assetId || a.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const buffer = Buffer.from(contentBase64, 'base64');
  const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Encrypt with AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipherKey = crypto.createHash('sha256').update(JWT_SECRET + asset.assetId).digest();
  const cipher = crypto.createCipheriv('aes-256-gcm', cipherKey, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const fileId = `offchain-${asset.assetId.toLowerCase()}`;
  const filePath = path.join(OFFCHAIN_DIR, `${fileId}.enc`);
  fs.writeFileSync(filePath, encrypted);

  const offchainRecord: OffchainFile = {
    id: fileId,
    assetId: asset.assetId,
    filename,
    mimeType: mimeType || 'application/octet-stream',
    sizeBytes: buffer.length,
    sha256Hash,
    encryptedFilePath: filePath,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    uploadedByDid: (req as any).user.did,
    uploadedAt: new Date().toISOString(),
    verifiedAt: new Date().toISOString(),
  };

  db.offchainFiles[fileId] = offchainRecord;
  asset.offchainId = fileId;
  asset.offchainHash = sha256Hash;
  asset.updatedAt = new Date().toISOString();

  // Store SHA-256 Hash on ledger (Critical: raw data never on chain, only hash reference!)
  appendLedgerEvent('ASSET_REGISTERED', (req as any).user.did, asset.assetId, {
    action: 'OFFCHAIN_ENCRYPTED_PAYLOAD_ANCHORED',
    offchainId: fileId,
    filename,
    sha256Hash,
    cipher: 'AES-256-GCM',
    sizeBytes: buffer.length,
  });

  saveDatabase();
  res.status(201).json({
    message: 'Encrypted off-chain payload anchored and registered',
    fileId,
    sha256Hash,
    filename,
    sizeBytes: buffer.length,
  });
});

// Download / Read off-chain payload with Smart Contract Check + Hash Integrity Check
app.get('/api/storage/:id/download', authenticateToken, (req, res) => {
  const { id } = req.params;
  const offchainRecord = db.offchainFiles[id] || Object.values(db.offchainFiles).find((f) => f.assetId === id);
  if (!offchainRecord) {
    return res.status(404).json({ error: 'Off-chain file record not found' });
  }

  const user = (req as any).user;
  const asset = db.assets.find((a) => a.assetId === offchainRecord.assetId);

  // 1. SMART CONTRACT AUTHORIZATION CHECK
  const auth = checkAccess(user.did, user.role, offchainRecord.assetId, 'VIEW');
  if (!auth.allowed) {
    appendLedgerEvent('ACCESS_DENIED', user.did, offchainRecord.assetId, {
      action: 'OFFCHAIN_PAYLOAD_DOWNLOAD_DENIED',
      reason: auth.reason,
    });
    runAISecurityAnalytics(user.did, offchainRecord.assetId, true);
    return res.status(403).json({ error: `Access Denied: ${auth.reason}` });
  }

  // 2. RETRIEVE ENCRYPTED PAYLOAD
  if (!fs.existsSync(offchainRecord.encryptedFilePath)) {
    return res.status(404).json({ error: 'Encrypted file chunk missing from off-chain storage pool' });
  }

  const encryptedData = fs.readFileSync(offchainRecord.encryptedFilePath);
  const iv = Buffer.from(offchainRecord.ivHex, 'hex');
  const authTag = Buffer.from(offchainRecord.authTagHex, 'hex');
  const cipherKey = crypto.createHash('sha256').update(JWT_SECRET + offchainRecord.assetId).digest();

  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', cipherKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    // 3. CRYPTOGRAPHIC SHA-256 INTEGRITY VERIFICATION
    const computedHash = crypto.createHash('sha256').update(decrypted).digest('hex');

    if (computedHash !== offchainRecord.sha256Hash) {
      // TAMPER DETECTED!
      appendLedgerEvent('TAMPER_DETECTED', user.did, offchainRecord.assetId, {
        error: 'OFFCHAIN_PAYLOAD_HASH_MISMATCH',
        expectedHash: offchainRecord.sha256Hash,
        actualComputedHash: computedHash,
      });

      db.securityAlerts.unshift({
        id: `ALT-TAMPER-${Date.now().toString(36)}`,
        anomalyScore: 100,
        riskLevel: 'HIGH',
        reason: 'CRITICAL: Off-chain storage payload SHA-256 mismatch detected during decryption. Potential data tampering!',
        userDid: user.did,
        userName: user.name,
        assetId: offchainRecord.assetId,
        details: { expectedHash: offchainRecord.sha256Hash, actualComputedHash: computedHash },
        status: 'UNRESOLVED',
        createdAt: new Date().toISOString(),
      });

      return res.status(500).json({
        error: 'CRITICAL SECURITY ALERT: Cryptographic hash verification failed! Data tampering detected. Access blocked.',
      });
    }

    // 4. Return decrypted authorized data
    appendLedgerEvent('STORAGE_VERIFIED', user.did, offchainRecord.assetId, {
      action: 'PAYLOAD_DECRYPTED_AND_HASH_VERIFIED',
      sha256Hash: computedHash,
    });

    res.json({
      success: true,
      filename: offchainRecord.filename,
      mimeType: offchainRecord.mimeType,
      sizeBytes: offchainRecord.sizeBytes,
      sha256Hash: computedHash,
      payloadBase64: decrypted.toString('base64'),
      verifiedWithOnChainHash: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Decryption failed: ' + err.message });
  }
});

// NOTIFICATIONS
app.get('/api/notifications', authenticateToken, (req, res) => {
  const user = (req as any).user;
  const userNotifs = db.notifications.filter(
    (n) => !n.targetRole || n.targetRole === user.role || n.targetUserDid === user.did
  );
  res.json(userNotifs);
});

app.post('/api/notifications/mark-read', authenticateToken, (req, res) => {
  const user = (req as any).user;
  db.notifications.forEach((n) => {
    if (!n.targetRole || n.targetRole === user.role || n.targetUserDid === user.did) {
      n.read = true;
    }
  });
  saveDatabase();
  res.json({ success: true });
});

// RESET ENTIRE SYSTEM TO CLEAN INITIAL STATE (For judges testing demo repeatedly)
app.post('/api/system/reset-demo', authenticateToken, requireRole(['ADMINISTRATOR']), (req, res) => {
  seedInitialData();
  res.json({ message: 'System state reset to clean initial demo state', success: true });
});

// START SERVER WITH VITE DEV MIDDLEWARE
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` CHAINIDENTITY Enterprise Server Running on http://0.0.0.0:${PORT}`);
    console.log(` Zero-Trust Decentralized Identity & Asset Governance`);
    console.log(` Blockchain Provider: ${db.blockchainProvider}`);
    console.log(` Total Initial Blocks in Ledger: ${db.ledger.length}`);
    console.log(`=======================================================`);
  });
}

// In standard Node/Docker/dev environments, start the listener.
// In Vercel serverless functions, Vercel invokes the exported app handler.
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
export { app };

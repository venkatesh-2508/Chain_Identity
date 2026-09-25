export type UserRole = 'ADMINISTRATOR' | 'SECURITY_MANAGER' | 'EMPLOYEE' | 'AUDITOR';

export interface User {
  id: string;
  name: string;
  email: string;
  did: string;
  role: UserRole;
  department: string;
  organization: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
  createdAt?: string;
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
  assetId: string;
  tokenId: string;
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
  assetId: string;
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
  anomalyScore: number;
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

export interface IntegrityVerificationResult {
  status: 'INTEGRITY_VERIFIED' | 'INTEGRITY_FAILURE';
  verified: boolean;
  message: string;
  totalBlocksChecked: number;
  failureIndex: number | null;
  failureReason: string | null;
  provider: string;
  genesisHash: string;
  latestBlockHash: string;
  checkedAt: string;
}

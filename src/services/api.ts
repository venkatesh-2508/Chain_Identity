import axios from 'axios';
import { 
  User, 
  DIDDocument, 
  DigitalAsset, 
  AssetAllocation, 
  AccessRequest, 
  LedgerEvent, 
  SecurityAlert, 
  AppNotification,
  IntegrityVerificationResult
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chainidentity_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return structured error
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
};

export const usersApi = {
  getAll: async () => {
    const res = await api.get<User[]>('/users');
    return res.data;
  },
  create: async (data: {
    name: string;
    email: string;
    role: string;
    department?: string;
    organization?: string;
    customDidSuffix?: string;
    password?: string;
  }) => {
    const res = await api.post<{ user: User; didDocument: DIDDocument }>('/users', data);
    return res.data;
  },
  getDid: async (did: string) => {
    const res = await api.get<{ didDocument: DIDDocument; userMetadata: Partial<User> | null }>(`/dids/${did}`);
    return res.data;
  },
  updateRole: async (userId: string, role: string) => {
    const res = await api.post<{ message: string; user: User }>(`/users/${userId}/roles`, { role });
    return res.data;
  },
};

export const assetsApi = {
  getAll: async () => {
    const res = await api.get<DigitalAsset[]>('/assets');
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<{
      asset: DigitalAsset;
      allocations: AssetAllocation[];
      events: LedgerEvent[];
      offchainFile: any;
    }>(`/assets/${id}`);
    return res.data;
  },
  create: async (data: {
    assetId: string;
    name: string;
    description: string;
    assetType: string;
    classification: string;
  }) => {
    const res = await api.post<DigitalAsset>('/assets', data);
    return res.data;
  },
  tokenize: async (assetId: string) => {
    const res = await api.post<{
      message: string;
      asset: DigitalAsset;
      transaction: { transactionId: string; blockIndex: number; blockHash: string; timestamp: string };
    }>(`/assets/${assetId}/tokenize`);
    return res.data;
  },
  allocate: async (assetId: string, userDid: string, permissions: string[]) => {
    const res = await api.post<{
      message: string;
      allocation: AssetAllocation;
      transaction: { transactionId: string; blockHash: string; timestamp: string };
    }>(`/assets/${assetId}/allocate`, { userDid, permissions });
    return res.data;
  },
  revoke: async (assetId: string, userDid: string, reason?: string) => {
    const res = await api.post<{
      message: string;
      allocation: AssetAllocation;
      transaction: { transactionId: string; blockHash: string; timestamp: string };
    }>(`/assets/${assetId}/revoke`, { userDid, reason });
    return res.data;
  },
  executeAction: async (assetId: string, action: string) => {
    const res = await api.post<{
      decision: 'ALLOW' | 'DENY';
      allowed: boolean;
      reason: string;
      transactionId: string;
      blockHash: string;
      timestamp: string;
      aiAnalysis?: any;
    }>(`/assets/${assetId}/execute-action`, { action });
    return res.data;
  },
};

export const accessRequestsApi = {
  getAll: async () => {
    const res = await api.get<AccessRequest[]>('/access-requests');
    return res.data;
  },
  create: async (data: { assetId: string; action: string; reason: string; durationHours?: number }) => {
    const res = await api.post<AccessRequest>('/access-requests', data);
    return res.data;
  },
  approve: async (id: string) => {
    const res = await api.post<{ message: string; request: AccessRequest; blockHash: string }>(`/access-requests/${id}/approve`);
    return res.data;
  },
  deny: async (id: string, reason: string) => {
    const res = await api.post<{ message: string; request: AccessRequest; blockHash: string }>(`/access-requests/${id}/deny`, { reason });
    return res.data;
  },
};

export const auditApi = {
  getEvents: async (params?: { eventType?: string; userDid?: string; assetId?: string; limit?: number }) => {
    const res = await api.get<{
      blockchainProvider: 'local' | 'fabric';
      totalBlocks: number;
      tampered: boolean;
      events: LedgerEvent[];
    }>('/audit', { params });
    return res.data;
  },
  verifyIntegrity: async () => {
    const res = await api.post<IntegrityVerificationResult>('/audit/verify');
    return res.data;
  },
  simulateTamper: async () => {
    const res = await api.post<{ message: string; blockIndex: number }>('/audit/simulate-tamper');
    return res.data;
  },
  repairLedger: async () => {
    const res = await api.post<{ message: string; verified: boolean }>('/audit/repair-ledger');
    return res.data;
  },
  setProvider: async (provider: 'local' | 'fabric') => {
    const res = await api.post<{ message: string; blockchainProvider: 'local' | 'fabric' }>('/blockchain/provider', { provider });
    return res.data;
  },
};

export const securityApi = {
  getAlerts: async () => {
    const res = await api.get<SecurityAlert[]>('/security/alerts');
    return res.data;
  },
  getAnalytics: async () => {
    const res = await api.get<{
      totalAnalyzed: number;
      highRiskCount: number;
      mediumRiskCount: number;
      lowRiskCount: number;
      deniedCount: number;
      allowedCount: number;
      unresolvedAlerts: number;
      recentAlerts: SecurityAlert[];
    }>('/security/analytics');
    return res.data;
  },
  investigateAlert: async (id: string, data: { status: string; notes?: string }) => {
    const res = await api.post<{
      alert: SecurityAlert;
      investigationContext: any;
    }>(`/security/alerts/${id}/investigate`, data);
    return res.data;
  },
  simulateAnomaly: async (data: { userDid?: string; assetId?: string; scenario?: string }) => {
    const res = await api.post<{ message: string; alert: SecurityAlert }>('/security/simulate-anomaly', data);
    return res.data;
  },
  grantEmergencyAccess: async (data: { userDid: string; assetId: string; reason: string; durationMinutes?: number }) => {
    const res = await api.post('/emergency-access', data);
    return res.data;
  },
};

export const storageApi = {
  downloadPayload: async (assetId: string) => {
    const res = await api.get<{
      success: boolean;
      filename: string;
      mimeType: string;
      sizeBytes: number;
      sha256Hash: string;
      payloadBase64: string;
      verifiedWithOnChainHash: boolean;
    }>(`/storage/${assetId}/download`);
    return res.data;
  },
  uploadPayload: async (data: { assetId: string; filename: string; contentBase64: string; mimeType?: string }) => {
    const res = await api.post('/storage/upload', data);
    return res.data;
  },
};

export const notificationsApi = {
  getAll: async () => {
    const res = await api.get<AppNotification[]>('/notifications');
    return res.data;
  },
  markRead: async () => {
    const res = await api.post('/notifications/mark-read');
    return res.data;
  },
};

export default api;

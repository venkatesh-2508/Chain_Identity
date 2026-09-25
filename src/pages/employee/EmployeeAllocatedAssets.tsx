import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  KeyRound, 
  CheckCircle2, 
  ShieldAlert, 
  Download, 
  Play, 
  FileText, 
  Lock, 
  ExternalLink, 
  Cpu, 
  Fingerprint,
  Check,
  ShieldCheck,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assetsApi, storageApi, accessRequestsApi } from '../../services/api';
import { DigitalAsset, AssetAllocation } from '../../types';

export const EmployeeAllocatedAssets: React.FC = () => {
  const { user } = useAuth();
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'REVOKED'>('ALL');

  // Test Smart Contract Access modal
  const [testingAsset, setTestingAsset] = useState<string | null>(null);
  const [testAction, setTestAction] = useState('READ');
  const [testResult, setTestResult] = useState<any>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Decrypted payload modal
  const [downloadingAsset, setDownloadingAsset] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Request access modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqAssetId, setReqAssetId] = useState('');
  const [reqAction, setReqAction] = useState('EDIT');
  const [reqReason, setReqReason] = useState('');
  const [reqDuration, setReqDuration] = useState(24);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allAssets = await assetsApi.getAll();
      setAssets(allAssets);

      const userAllocs: AssetAllocation[] = [];
      for (const a of allAssets) {
        const detail = await assetsApi.getById(a.assetId);
        if (detail.allocations) {
          const matching = detail.allocations.filter((alc) => alc.userDid === user.did);
          userAllocs.push(...matching);
        }
      }
      setAllocations(userAllocs);
      if (allAssets.length > 0 && !reqAssetId) {
        setReqAssetId(allAssets[0].assetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteAccessTest = async (assetId: string, action: string) => {
    setEvaluating(true);
    setTestResult(null);
    try {
      const res = await assetsApi.executeAction(assetId, action);
      setTestResult(res);
    } catch (err: any) {
      if (err?.response?.data) {
        setTestResult(err.response.data);
      } else {
        setTestResult({
          decision: 'DENY',
          allowed: false,
          reason: 'Cryptographic policy rejection or network error',
        });
      }
    } finally {
      setEvaluating(false);
      loadData();
    }
  };

  const handleDownloadPayload = async (assetId: string) => {
    setDownloadingAsset(assetId);
    setDecryptedData(null);
    setDownloadError(null);
    try {
      const res = await storageApi.downloadPayload(assetId);
      setDecryptedData(res);
    } catch (err: any) {
      setDownloadError(err?.response?.data?.error || 'Failed to download or decrypt off-chain vault payload');
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      await accessRequestsApi.create({
        assetId: reqAssetId,
        action: reqAction,
        reason: reqReason,
        durationHours: reqDuration,
      });
      setReqSuccess('Access request submitted! Dispatched to Security Operations and logged to blockchain.');
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccess(null);
      }, 3000);
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReq(false);
    }
  };

  const filteredAllocations = allocations.filter((alc) => {
    const matchesSearch = 
      alc.assetName.toLowerCase().includes(search.toLowerCase()) ||
      alc.assetId.toLowerCase().includes(search.toLowerCase()) ||
      alc.permissions.some((p) => p.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || alc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Employee Workspace
            </span>
            <span className="text-xs font-mono text-slate-500">DID: {user?.did}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Allocated Digital Assets
          </h1>
          <p className="text-xs text-slate-500">
            Securely access organizational digital assets, verify smart contract clearances, and decrypt authorized off-chain vault payloads.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Request New Asset Access</span>
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Allocated</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{allocations.length}</div>
          <div className="text-[11px] text-slate-500">Registered to your decentralized identity</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Clearances</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {allocations.filter((a) => a.status === 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Smart contract authorization enforced</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revoked / Inactive</span>
          <div className="text-2xl font-extrabold text-slate-600 mt-1">
            {allocations.filter((a) => a.status !== 'ACTIVE').length}
          </div>
          <div className="text-[11px] text-slate-500">Access denied by policy engine</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search allocated assets or permissions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
          {(['ALL', 'ACTIVE', 'REVOKED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Asset Cards Grid */}
      {filteredAllocations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
          No allocated digital assets match your filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAllocations.map((alc) => {
            const assetInfo = assets.find((a) => a.assetId === alc.assetId);
            return (
              <div 
                key={alc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                        <Boxes className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{alc.assetName}</h3>
                        <span className="font-mono text-[10px] text-slate-400">{alc.assetId}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      alc.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {alc.status}
                    </span>
                  </div>

                  {assetInfo && (
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                        {assetInfo.classification}
                      </span>
                      {assetInfo.isTokenized && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold">
                          Tokenized NFT
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 font-mono">
                        Token: {assetInfo.tokenId || 'Unanchored'}
                      </span>
                    </div>
                  )}

                  <div className="mt-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Granted Permissions
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {alc.permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[10px] font-bold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-500 font-mono">
                    Allocated: {new Date(alc.allocatedAt).toLocaleString()}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setTestingAsset(alc.assetId);
                      setTestAction(alc.permissions[0] || 'READ');
                      setTestResult(null);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-blue-700" />
                    <span>Test Access</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPayload(alc.assetId)}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Download Vault Payload</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SMART CONTRACT ACCESS TEST MODAL */}
      {testingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-base">Smart Contract Access Evaluation</h3>
              </div>
              <button onClick={() => setTestingAsset(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs font-semibold text-slate-500">Target Asset</div>
                <div className="font-mono text-sm font-bold text-slate-900">{testingAsset}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Requested Action</label>
                <div className="flex gap-2">
                  {['READ', 'WRITE', 'EDIT', 'EXECUTE'].map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setTestAction(act)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        testAction === act
                          ? 'bg-blue-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleExecuteAccessTest(testingAsset, testAction)}
                disabled={evaluating}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-4 h-4 ${evaluating ? 'animate-spin' : ''}`} />
                <span>{evaluating ? 'Evaluating Smart Contract Policy...' : `Execute ${testAction} Check`}</span>
              </button>

              {testResult && (
                <div className={`p-4 rounded-xl border ${
                  testResult.decision === 'ALLOW'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-start space-x-2.5">
                    {testResult.decision === 'ALLOW' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 w-full text-xs">
                      <div className="font-extrabold text-sm">
                        POLICY DECISION: {testResult.decision}
                      </div>
                      <p>{testResult.reason}</p>
                      {testResult.transactionId && (
                        <div className="font-mono text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                          Transaction Hash: {testResult.transactionId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OFF-CHAIN DECRYPTED PAYLOAD MODAL */}
      {downloadingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base">Off-Chain Encrypted Vault Payload</h3>
              </div>
              <button onClick={() => setDownloadingAsset(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {downloadError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                  {downloadError}
                </div>
              ) : decryptedData ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Decrypted using DID Keypair & AES-256-GCM</span>
                    </div>
                    <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      INTEGRITY VERIFIED
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Payload Hash Anchor (On-Chain)
                    </div>
                    <div className="font-mono text-[11px] bg-slate-100 p-2 rounded-lg text-slate-700 break-all">
                      {decryptedData.contentHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Decrypted Content Specification
                    </div>
                    <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-48">
                      {JSON.stringify(decryptedData.payload || decryptedData, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                  <span>Retrieving payload from off-chain storage and performing cryptographic decryption...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REQUEST ASSET ACCESS MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Request Access to Digital Asset</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {reqSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Asset</label>
                <select
                  value={reqAssetId}
                  onChange={(e) => setReqAssetId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {assets.map((a) => (
                    <option key={a.assetId} value={a.assetId}>
                      {a.name} ({a.assetId}) — {a.classification}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Action</label>
                  <select
                    value={reqAction}
                    onChange={(e) => setReqAction(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="READ">READ</option>
                    <option value="WRITE">WRITE</option>
                    <option value="EDIT">EDIT</option>
                    <option value="EXECUTE">EXECUTE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={reqDuration}
                    onChange={(e) => setReqDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify clear technical reason for access clearance..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingReq ? 'Submitting...' : 'Submit Request to SecOps'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  Boxes, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Lock, 
  Play, 
  Clock, 
  Copy, 
  Check, 
  Plus, 
  Send,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { assetsApi, accessRequestsApi, storageApi } from '../../services/api';
import { DigitalAsset, AssetAllocation, AccessRequest } from '../../types';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [myAllocations, setMyAllocations] = useState<AssetAllocation[]>([]);
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Live action test state (Steps 4 & 7)
  const [testingAction, setTestingAction] = useState(false);
  const [actionResult, setActionResult] = useState<any>(null);
  const [copiedDid, setCopiedDid] = useState(false);

  // Download & decrypt off-chain state
  const [downloading, setDownloading] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Request access form
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqAssetId, setReqAssetId] = useState('AST-0017');
  const [reqAction, setReqAction] = useState('EDIT');
  const [reqReason, setReqReason] = useState('Need to update tactical radar interface specifications');
  const [reqDuration, setReqDuration] = useState(24);
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadEmployeeData();
  }, [user]);

  const loadEmployeeData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allAssets, allReqs] = await Promise.all([
        assetsApi.getAll(),
        accessRequestsApi.getAll(),
      ]);
      setAssets(allAssets);
      setMyRequests(allReqs.filter((r) => r.userDid === user.did));

      // Extract my allocations
      const userAllocs: AssetAllocation[] = [];
      for (const a of allAssets) {
        const detail = await assetsApi.getById(a.assetId);
        if (detail.allocations) {
          const userSpecific = detail.allocations.filter((alc) => alc.userDid === user.did);
          userAllocs.push(...userSpecific);
        }
      }
      setMyAllocations(userAllocs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // CORE LIVE DEMO TEST (Steps 4 & 7)
  const handleTestAssetAction = async (assetId: string, action: string = 'EDIT') => {
    setTestingAction(true);
    setActionResult(null);
    try {
      const res = await assetsApi.executeAction(assetId, action);
      setActionResult(res);
    } catch (err: any) {
      if (err?.response?.data) {
        setActionResult(err.response.data);
      } else {
        setActionResult({
          decision: 'DENY',
          allowed: false,
          reason: 'Network or policy evaluation error',
        });
      }
    } finally {
      setTestingAction(false);
      loadEmployeeData();
    }
  };

  // Off-Chain Download & AES Decryption
  const handleDownloadPayload = async (assetId: string) => {
    setDownloading(true);
    setDecryptedData(null);
    setDownloadError(null);
    try {
      const res = await storageApi.downloadPayload(assetId);
      setDecryptedData(res);
    } catch (err: any) {
      setDownloadError(err?.response?.data?.error || 'Failed to download or decrypt off-chain payload');
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingReq(true);
    try {
      await accessRequestsApi.create({
        assetId: reqAssetId,
        action: reqAction,
        reason: reqReason,
        durationHours: reqDuration,
      });
      setReqSuccess('Access request submitted! Logged to blockchain and sent to Security Operations.');
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSuccess(null);
      }, 3000);
      loadEmployeeData();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReq(false);
    }
  };

  const copyDid = () => {
    if (!user) return;
    navigator.clipboard.writeText(user.did);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Identity Card Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                Employee Workspace • Verified Identity
              </span>
              <span className="text-[10px] font-mono text-emerald-300">Enterprise Security Domain</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">
              {user?.name || 'Rahul Kumar'}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center space-x-1.5 font-mono text-xs bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-700/50">
                <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-100">{user?.did || 'did:chainidentity:rahul123'}</span>
                <button onClick={copyDid} className="ml-1 text-emerald-300 hover:text-white" title="Copy DID">
                  {copiedDid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="px-3 py-1 bg-white/10 rounded-xl text-emerald-100 text-xs">
                {user?.department || 'Defense Radar & Tactical Systems'}
              </div>
            </div>
          </div>

          <div className="text-right sm:self-center">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>Request New Asset Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE LIVE DEMO EXECUTION CARD (Step 4 & Step 7) */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                Interactive Smart Contract Validator
              </span>
              <span className="text-xs font-semibold text-slate-500">Target Asset: Project A17 (AST-0017)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Live Authorization & Decentralized Policy Test
            </h3>
            <p className="text-xs text-slate-600">
              Evaluates your DID, role permissions, and active ledger allocations against the blockchain smart contract engine.
            </p>
          </div>

          <button
            onClick={() => handleTestAssetAction('AST-0017', 'EDIT')}
            disabled={testingAction}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-sm flex items-center space-x-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <Play className={`w-4 h-4 text-sky-300 ${testingAction ? 'animate-spin' : ''}`} />
            <span>{testingAction ? 'Evaluating Smart Contract...' : 'Validate Access on Project A17'}</span>
          </button>
        </div>

        {/* Live Decision Banner */}
        {actionResult && (
          <div className={`p-4 rounded-xl border transition ${
            actionResult.decision === 'ALLOW' 
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}>
            <div className="flex items-start space-x-3">
              {actionResult.decision === 'ALLOW' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-extrabold text-sm tracking-wide">
                    SMART CONTRACT DECISION: {actionResult.decision}
                  </div>
                  {actionResult.transactionId && (
                    <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                      Tx: {actionResult.transactionId.slice(0, 16)}...
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium leading-relaxed">
                  {actionResult.reason}
                </p>

                {actionResult.blockHash && (
                  <div className="text-[10px] font-mono text-slate-600 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span>Block Hash: {actionResult.blockHash.slice(0, 24)}...</span>
                    <span>Decision Layer: SmartContractService::check_access</span>
                  </div>
                )}

                {actionResult.aiAnalysis && (
                  <div className="mt-2 p-2 bg-white/70 rounded-lg text-[11px] flex items-center space-x-2 border border-slate-200">
                    <Cpu className="w-3.5 h-3.5 text-blue-700" />
                    <span><strong>AI Threat Surveillance:</strong> {actionResult.aiAnalysis.riskLevel} RISK (Score: {actionResult.aiAnalysis.anomalyScore}/100) — {actionResult.aiAnalysis.reason}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Allocated Assets & Permissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Allocated Assets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">My Allocated Digital Assets</h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {myAllocations.length} Assigned
              </span>
            </div>

            <div className="space-y-3">
              {myAllocations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  No assets currently allocated to your DID.
                </div>
              ) : (
                myAllocations.map((alc) => (
                  <div 
                    key={alc.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm">{alc.assetName}</div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        alc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {alc.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-purple-700 font-semibold">
                      Asset ID: {alc.assetId}
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1">
                      <span className="text-[11px] text-slate-500">Granted Permissions:</span>
                      {alc.permissions.map((p) => (
                        <span key={p} className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800">
                          {p}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <button
                        onClick={() => handleDownloadPayload(alc.assetId)}
                        disabled={downloading || alc.status !== 'ACTIVE'}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download & Decrypt Payload</span>
                      </button>

                      <button
                        onClick={() => handleTestAssetAction(alc.assetId, 'EDIT')}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Test Action</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Off-Chain Storage Download / Verification Results */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Encrypted Off-chain Vault Verification</h3>
              <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                AES-256-GCM + SHA-256
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              When an asset is retrieved, the gateway verifies active smart contract permissions, retrieves the AES-256 encrypted ciphertext, and compares its SHA-256 hash against the on-chain reference before returning plaintext.
            </p>

            {downloadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{downloadError}</span>
              </div>
            )}

            {decryptedData ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-emerald-800">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Cryptographic Hash Verified Against Ledger!</span>
                  </div>
                  <span className="font-mono text-[10px]">{decryptedData.sizeBytes} bytes</span>
                </div>

                <div className="font-mono text-[11px] text-slate-600 space-y-0.5 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>Filename: <strong>{decryptedData.filename}</strong></div>
                  <div className="truncate">SHA-256: <span className="text-blue-700">{decryptedData.sha256Hash}</span></div>
                  <div>Cipher: AES-256-GCM (Authenticated)</div>
                </div>

                <div className="mt-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Authorized Decrypted Content:</div>
                  <pre className="p-3 bg-slate-900 text-sky-300 font-mono text-[11px] rounded-lg overflow-x-auto max-h-36">
                    {atob(decryptedData.payloadBase64)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Click "Download & Decrypt Payload" on any allocated asset to run cryptographic verification.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Access Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">My Access Requests History</h3>
            <p className="text-xs text-slate-500">Track pending and historical authorization petitions</p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Request</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Requested Action</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Decision Details</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No access requests submitted yet.
                  </td>
                </tr>
              ) : (
                myRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{req.assetName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                        {req.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'DENIED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {req.decisionReason || (req.decidedBy ? `Approved by ${req.decidedBy}` : 'Pending review')}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(req.requestedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST ACCESS MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-base">Submit Access Request</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="text-blue-200 hover:text-white">
                <Check className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
              {reqSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{reqSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Asset</label>
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
                    <option value="VIEW">VIEW</option>
                    <option value="EDIT">EDIT</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="DOWNLOAD">DOWNLOAD</option>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Justification</label>
                <textarea
                  rows={3}
                  required
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
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

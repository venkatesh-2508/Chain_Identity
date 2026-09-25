import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Plus, 
  Boxes, 
  Check, 
  X, 
  Calendar,
  Lock,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { accessRequestsApi, assetsApi } from '../../services/api';
import { AccessRequest, DigitalAsset } from '../../types';

export const EmployeeAccessRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'DENIED'>('ALL');

  // Modal for new request
  const [showModal, setShowModal] = useState(false);
  const [reqAssetId, setReqAssetId] = useState('');
  const [reqAction, setReqAction] = useState('EDIT');
  const [reqReason, setReqReason] = useState('');
  const [reqDuration, setReqDuration] = useState(24);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allReqs, allAssets] = await Promise.all([
        accessRequestsApi.getAll(),
        assetsApi.getAll(),
      ]);
      setAssets(allAssets);
      setRequests(allReqs.filter((r) => r.userDid === user.did));
      if (allAssets.length > 0 && !reqAssetId) {
        setReqAssetId(allAssets[0].assetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await accessRequestsApi.create({
        assetId: reqAssetId,
        action: reqAction,
        reason: reqReason,
        durationHours: reqDuration,
      });
      setActionSuccess('Access request submitted! Logged to blockchain and pending Security Manager review.');
      setReqReason('');
      setShowModal(false);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.assetName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetId.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.action.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const deniedCount = requests.filter((r) => r.status === 'DENIED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Access Governance
            </span>
            <span className="text-xs font-mono text-slate-500">Employee Requests Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Request Asset Access & Status
          </h1>
          <p className="text-xs text-slate-500">
            Submit formal access requests for digital assets and track real-time authorization status from Security Operations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Access Request</span>
          </button>
          <button
            onClick={loadData}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting SecOps authorization</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved Requests</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{approvedCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Active cryptographic permissions granted</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Denied Requests</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{deniedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Rejected by security policy</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search your requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-xs text-slate-500 font-semibold mr-1">Status:</span>
          {(['ALL', 'PENDING', 'APPROVED', 'DENIED'] as const).map((st) => (
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

      {/* Requests List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No access requests found matching your filter.
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : req.status === 'DENIED'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {req.status === 'APPROVED' ? (
                      <Check className="w-5 h-5" />
                    ) : req.status === 'DENIED' ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Clock className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-sm">{req.assetName}</h3>
                      <span className="font-mono text-xs text-slate-400">({req.assetId})</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span>Requested Action: <strong className="text-slate-700">{req.action}</strong></span>
                      <span>•</span>
                      <span>Duration: <strong className="text-slate-700">{req.durationHours} hrs</strong></span>
                      <span>•</span>
                      <span>Submitted: {new Date(req.requestedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto ${
                  req.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : req.status === 'DENIED'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Justification & Reviewer notes */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <div><strong>Business Reason:</strong> {req.reason}</div>
                {req.decidedBy && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 flex flex-wrap justify-between">
                    <span>Reviewed by: <span className="font-mono">{req.decidedBy}</span></span>
                    {req.decidedAt && <span>Decision Time: {new Date(req.decidedAt).toLocaleString()}</span>}
                  </div>
                )}
                {req.decisionReason && (
                  <div className="text-rose-700 font-semibold pt-1 border-t border-rose-200">
                    Decision Note: {req.decisionReason}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* NEW REQUEST MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Submit Access Request</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
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
                  placeholder="Specify operational requirement or ticket reference..."
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Check, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  RefreshCw,
  Boxes,
  KeyRound
} from 'lucide-react';
import { accessRequestsApi } from '../../services/api';
import { AccessRequest } from '../../types';

export const AccessRequestsReview: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Deny modal
  const [denyingReq, setDenyingReq] = useState<AccessRequest | null>(null);
  const [denyReason, setDenyReason] = useState('Insufficient clearance for requested action under C-SOC policy');
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await accessRequestsApi.getAll();
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: AccessRequest) => {
    setProcessing(true);
    try {
      const res = await accessRequestsApi.approve(req.id);
      setActionSuccess(`Approved ${req.action} on ${req.assetName} for ${req.userName}. Smart contract ALLOW recorded on ledger!`);
      loadRequests();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeny = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denyingReq) return;
    setProcessing(true);
    try {
      const res = await accessRequestsApi.deny(denyingReq.id, denyReason);
      setActionSuccess(`Denied ${denyingReq.action} on ${denyingReq.assetName} for ${denyingReq.userName}. ACCESS_DENIED logged to ledger.`);
      setDenyingReq(null);
      loadRequests();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesSearch = 
      r.assetName.toLowerCase().includes(search.toLowerCase()) ||
      r.assetId.toLowerCase().includes(search.toLowerCase()) ||
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.userDid.toLowerCase().includes(search.toLowerCase()) ||
      r.reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Access Governance
            </span>
            <span className="text-xs font-mono text-slate-500">Security Manager Review</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Access Request Authorization
          </h1>
          <p className="text-xs text-slate-500">
            Evaluate inbound employee requests for asset permissions. Decisions are enforced via smart contract and recorded on the ledger.
          </p>
        </div>

        <button
          onClick={loadRequests}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset, user, or justification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
          >
            <option value="ALL">All Requests</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DENIED">DENIED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Target Asset</th>
                <th className="py-3.5 px-4">Action Requested</th>
                <th className="py-3.5 px-4">Reason / Justification</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Loading requests...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No access requests found.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[160px]" title={req.userDid}>
                        {req.userDid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{req.assetName}</div>
                      <div className="text-[11px] font-mono text-purple-700">{req.assetId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                        {req.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-700 truncate" title={req.reason}>{req.reason}</div>
                      <div className="text-[10px] text-slate-400">Duration: {req.durationHours} hrs</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'DENIED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleApprove(req)}
                            disabled={processing}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setDenyingReq(req)}
                            disabled={processing}
                            className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Deny</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Decided by {req.decidedBy}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DENY MODAL */}
      {denyingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Deny Access Request</h3>
              <button onClick={() => setDenyingReq(null)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeny} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Denial</label>
                <textarea
                  rows={3}
                  required
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDenyingReq(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {processing ? 'Logging Denial...' : 'Confirm Denial (Record on Chain)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

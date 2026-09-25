import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  Boxes,
  Lock,
  RefreshCw,
  Plus,
  X
} from 'lucide-react';
import { assetsApi, usersApi } from '../../services/api';
import { AssetAllocation, DigitalAsset, User } from '../../types';

export const AllocationsView: React.FC = () => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Revoke Modal
  const [revokingAlloc, setRevokingAlloc] = useState<AssetAllocation | null>(null);
  const [revokeReason, setRevokeReason] = useState('Routine access expiration or security review');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAssets, allUsers] = await Promise.all([assetsApi.getAll(), usersApi.getAll()]);
      setAssets(allAssets);
      setUsers(allUsers);

      // Collect allocations from asset details
      const allocList: AssetAllocation[] = [];
      for (const a of allAssets) {
        try {
          const detail = await assetsApi.getById(a.assetId);
          if (detail.allocations) {
            allocList.push(...detail.allocations);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setAllocations(allocList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingAlloc) return;
    setProcessing(true);
    setActionError(null);

    try {
      const res = await assetsApi.revoke(revokingAlloc.assetId, revokingAlloc.userDid, revokeReason);
      setActionSuccess(`Revoked access for ${revokingAlloc.userName} on ${revokingAlloc.assetName}. Logged to blockchain!`);
      setRevokingAlloc(null);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to revoke allocation');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = allocations.filter((alc) => {
    const matchesSearch = 
      alc.assetName.toLowerCase().includes(search.toLowerCase()) ||
      alc.assetId.toLowerCase().includes(search.toLowerCase()) ||
      alc.userName.toLowerCase().includes(search.toLowerCase()) ||
      alc.userDid.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || alc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Access Governance
            </span>
            <span className="text-xs font-mono text-slate-500">Fine-Grained RBAC</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Asset Allocations & Permissions
          </h1>
          <p className="text-xs text-slate-500">
            View active user-to-asset bindings, evaluate permission scopes, and trigger cryptographic revocations.
          </p>
        </div>

        <button
          onClick={loadData}
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

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset, user, or DID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="REVOKED">REVOKED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Subject (User & DID)</th>
                <th className="py-3.5 px-4">Permissions</th>
                <th className="py-3.5 px-4">Allocated By</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Loading allocations...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No allocations matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((alc) => (
                  <tr key={alc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{alc.assetName}</div>
                      <div className="text-[11px] font-mono text-blue-700">{alc.assetId}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{alc.userName}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-[180px]" title={alc.userDid}>
                        {alc.userDid}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {alc.permissions.map((p) => (
                          <span key={p} className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{alc.allocatedBy}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(alc.allocatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        alc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        alc.status === 'REVOKED' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {alc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {alc.status === 'ACTIVE' ? (
                        <button
                          onClick={() => setRevokingAlloc(alc)}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Revoke Access</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Revoked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REVOKE MODAL */}
      {revokingAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-base">Revoke Access Permissions</h3>
              </div>
              <button onClick={() => setRevokingAlloc(null)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRevoke} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Zero-Trust Enforcement:</strong> Revoking access will immediately commit a revocation event to the blockchain ledger and subsequent access evaluations will return <strong>DENY</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Revocation</label>
                <textarea
                  rows={3}
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingAlloc(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {processing ? 'Logging Revocation...' : 'Confirm Revocation (Record on Chain)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

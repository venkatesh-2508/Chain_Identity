import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldAlert, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  Lock, 
  RefreshCw,
  X 
} from 'lucide-react';
import { assetsApi } from '../../services/api';
import { AssetAllocation } from '../../types';

export const PermissionsManager: React.FC = () => {
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Revoke modal
  const [revokingAlloc, setRevokingAlloc] = useState<AssetAllocation | null>(null);
  const [revokeReason, setRevokeReason] = useState('Routine audit or privilege reduction by SecOps');
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAllocations();
  }, []);

  const loadAllocations = async () => {
    setLoading(true);
    try {
      const allAssets = await assetsApi.getAll();
      const list: AssetAllocation[] = [];
      for (const a of allAssets) {
        const detail = await assetsApi.getById(a.assetId);
        if (detail.allocations) {
          list.push(...detail.allocations);
        }
      }
      setAllocations(list);
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

    try {
      const res = await assetsApi.revoke(revokingAlloc.assetId, revokingAlloc.userDid, revokeReason);
      setActionSuccess(`Successfully revoked access for ${revokingAlloc.userName} on ${revokingAlloc.assetName}! Logged to blockchain.`);
      setRevokingAlloc(null);
      loadAllocations();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const filtered = allocations.filter((a) =>
    a.assetName.toLowerCase().includes(search.toLowerCase()) ||
    a.assetId.toLowerCase().includes(search.toLowerCase()) ||
    a.userName.toLowerCase().includes(search.toLowerCase()) ||
    a.userDid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Access Governance
            </span>
            <span className="text-xs font-mono text-slate-500">Fine-Grained Policy Revocation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Permissions & Immediate Revocation
          </h1>
          <p className="text-xs text-slate-500">
            Revoke active user grants. Revocations are immediately committed to the blockchain and enforce smart contract DENY.
          </p>
        </div>

        <button
          onClick={loadAllocations}
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

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset name, user, or DID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Asset</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Active Permissions</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Revocation Info</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Loading permissions...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No active allocations found.
                  </td>
                </tr>
              ) : (
                filtered.map((alc) => (
                  <tr key={alc.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{alc.assetName}</div>
                      <div className="text-[11px] font-mono text-purple-700">{alc.assetId}</div>
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
                          <span key={p} className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                            {p}
                          </span>
                        ))}
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
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {alc.status === 'REVOKED' ? (
                        <div>
                          <div className="text-rose-700 font-semibold">{alc.revocationReason || 'Revoked by SecOps'}</div>
                          <div className="text-[10px] text-slate-400">By: {alc.revokedBy}</div>
                        </div>
                      ) : (
                        '—'
                      )}
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
                        <span className="text-[11px] text-slate-400 font-medium">Revoked on Chain</span>
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
              <h3 className="font-bold text-base">Confirm Permission Revocation</h3>
              <button onClick={() => setRevokingAlloc(null)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRevoke} className="p-6 space-y-4">
              <div className="text-xs text-slate-600">
                Are you sure you want to revoke <strong>{revokingAlloc.userName}'s</strong> access to <strong>{revokingAlloc.assetName}</strong>?
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Revocation Justification</label>
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
                  {processing ? 'Revoking...' : 'Confirm Revocation (Record on Chain)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

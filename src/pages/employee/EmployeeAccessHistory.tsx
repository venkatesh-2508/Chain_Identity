import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  Fingerprint, 
  Cpu, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/api';
import { LedgerEvent } from '../../types';

export const EmployeeAccessHistory: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await auditApi.getEvents();
      // Filter events where the actor is this user, or userDid matches in payload
      const userEvents = data.events.filter(
        (e) => e.actorDid === user.did || e.payload?.userDid === user.did
      );
      setEvents(userEvents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch = 
      e.eventId.toLowerCase().includes(search.toLowerCase()) ||
      (e.assetId && e.assetId.toLowerCase().includes(search.toLowerCase())) ||
      e.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(e.payload).toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'ALL' || e.eventType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Cryptographic Audit
            </span>
            <span className="text-xs font-mono text-slate-500">DID: {user?.did}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Access History & Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable blockchain ledger records of every access evaluation, permission grant, and transaction signed with your DID.
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger Records</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ledger Events</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{events.length}</div>
          <div className="text-[11px] text-slate-500">Anchored to SHA-256 hash chain</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized Clearances</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {events.filter((e) => e.eventType === 'ACCESS_ALLOWED' || e.eventType === 'ASSET_ALLOCATED').length}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium">Smart contract policy ALLOW</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access Denials / Alerts</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {events.filter((e) => e.eventType === 'ACCESS_DENIED' || e.eventType === 'SECURITY_ALERT').length}
          </div>
          <div className="text-[11px] text-rose-700 font-medium">Enforced zero-trust blocks</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by transaction ID, asset, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'ACCESS_ALLOWED', 'ACCESS_DENIED', 'ASSET_ALLOCATED', 'ACCESS_REVOKED'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                filterType === t
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.replace('ACCESS_', '').replace('ASSET_', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            No access ledger events recorded for your identity matching this filter.
          </div>
        ) : (
          filteredEvents.map((e, index) => {
            const isExpanded = expandedIndex === index;
            const isAllowed = e.eventType === 'ACCESS_ALLOWED' || e.eventType === 'ASSET_ALLOCATED';
            const isDenied = e.eventType === 'ACCESS_DENIED' || e.eventType === 'PERMISSION_REVOKED';

            return (
              <div
                key={e.eventId}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isAllowed 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : isDenied 
                        ? 'bg-rose-50 text-rose-700' 
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {isAllowed ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isDenied ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : (
                        <FileCheck2 className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{e.eventType}</span>
                        {e.assetId && (
                          <span className="font-mono text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {e.assetId}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>Tx: {e.transactionId.slice(0, 16)}...</span>
                        <span>•</span>
                        <span>Block #{e.index}</span>
                        <span>•</span>
                        <span>{new Date(e.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-auto">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isAllowed 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : isDenied 
                        ? 'bg-rose-100 text-rose-800' 
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isAllowed ? 'ALLOW' : isDenied ? 'DENY' : 'RECORDED'}
                    </span>
                    <button
                      onClick={() => setExpandedIndex(isExpanded ? null : index)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                      title="Inspect Raw Block Data"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Block Data Inspector */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[10px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400">Block SHA-256 Hash:</span>
                        <div className="text-slate-700 break-all">{e.currentHash}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Parent Previous Hash:</span>
                        <div className="text-slate-700 break-all">{e.previousHash}</div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48">
                      {JSON.stringify(e.payload, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

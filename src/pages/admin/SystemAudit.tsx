import React, { useState, useEffect } from 'react';
import { 
  FileSearch, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Fingerprint
} from 'lucide-react';
import { auditApi } from '../../services/api';
import { LedgerEvent } from '../../types';

export const SystemAudit: React.FC = () => {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await auditApi.getEvents();
      setEvents(data.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedHash(txt);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filtered = events.filter((e) => {
    const matchesSearch = 
      e.eventId.toLowerCase().includes(search.toLowerCase()) ||
      e.actorDid.toLowerCase().includes(search.toLowerCase()) ||
      (e.assetId && e.assetId.toLowerCase().includes(search.toLowerCase())) ||
      e.transactionId.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(e.payload).toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || e.eventType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Distributed Audit Ledger
            </span>
            <span className="text-xs font-mono text-slate-500">Tamper-Evident SHA-256 Hash Chain</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            System Blockchain Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable chronicle of all identity creations, role assignments, mint transactions, allocations, and smart contract decisions.
          </p>
        </div>

        <button
          onClick={loadAudit}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Event ID, DID, Asset ID, Tx Hash, or Payload..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Event Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All Event Types</option>
            <option value="DID_CREATED">DID_CREATED</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
            <option value="ASSET_REGISTERED">ASSET_REGISTERED</option>
            <option value="ASSET_MINTED">ASSET_MINTED</option>
            <option value="ASSET_ALLOCATED">ASSET_ALLOCATED</option>
            <option value="ACCESS_REQUESTED">ACCESS_REQUESTED</option>
            <option value="ACCESS_ALLOWED">ACCESS_ALLOWED</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="PERMISSION_REVOKED">PERMISSION_REVOKED</option>
            <option value="EMERGENCY_ACCESS">EMERGENCY_ACCESS</option>
            <option value="SECURITY_ALERT">SECURITY_ALERT</option>
          </select>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Reading blockchain blocks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No ledger events matching search criteria.
          </div>
        ) : (
          filtered.map((evt) => {
            const isExpanded = expandedBlock === evt.index;
            return (
              <div 
                key={evt.eventId}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:border-slate-300 transition"
              >
                <div 
                  onClick={() => setExpandedBlock(isExpanded ? null : evt.index)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                      #{evt.index}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.eventType.includes('ALLOWED') ? 'bg-emerald-100 text-emerald-800' :
                          evt.eventType.includes('DENIED') || evt.eventType.includes('REVOKED') ? 'bg-rose-100 text-rose-800' :
                          evt.eventType.includes('ALERT') ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {evt.eventType}
                        </span>
                        {evt.assetId && (
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {evt.assetId}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">
                          {evt.eventId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1 flex items-center space-x-2">
                        <span>Actor:</span>
                        <span className="font-mono text-blue-700 truncate max-w-xs">{evt.actorDid}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-auto text-xs">
                    <div className="text-right hidden md:block">
                      <div className="font-mono text-[10px] text-slate-400">Hash (SHA-256):</div>
                      <div className="font-mono text-blue-600 text-[11px]">
                        {evt.currentHash.slice(0, 16)}...
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/80 space-y-3 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Block Cryptographic Proof</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Previous Hash:</span>
                          <span className="text-slate-800" title={evt.previousHash}>{evt.previousHash.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Current Hash:</span>
                          <span className="text-blue-700 font-bold" title={evt.currentHash}>{evt.currentHash.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Tx ID:</span>
                          <span className="text-slate-800" title={evt.transactionId}>{evt.transactionId.slice(0, 18)}...</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Metadata & Signature</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Timestamp:</span>
                          <span className="text-slate-800">{new Date(evt.timestamp).toISOString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Signature:</span>
                          <span className="text-emerald-700 truncate max-w-[180px]">{evt.signature || 'VALID'}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-800 mb-1 text-xs">Canonical Block Payload (JSON):</div>
                      <pre className="p-3 bg-slate-900 text-sky-300 rounded-xl font-mono text-[11px] overflow-x-auto">
                        {JSON.stringify(evt.payload, null, 2)}
                      </pre>
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

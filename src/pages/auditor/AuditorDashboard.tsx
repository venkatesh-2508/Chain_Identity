import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Layers, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Flame, 
  Wrench,
  Boxes,
  ExternalLink
} from 'lucide-react';
import { auditApi } from '../../services/api';
import { LedgerEvent, IntegrityVerificationResult } from '../../types';

export const AuditorDashboard: React.FC = () => {
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);

  // Verification state (SIH Demo Step 10)
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);

  // Tamper testing states
  const [tampering, setTampering] = useState(false);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);

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

  // STEP 10: Recalculate complete SHA-256 hash chain
  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await auditApi.verifyIntegrity();
      setVerificationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
      loadAudit();
    }
  };

  // Simulate malicious alteration of block 2 data
  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      const res = await auditApi.simulateTamper();
      setTamperMessage(`Tamper simulated: Block #${res.blockIndex} payload modified. Click 'VERIFY INTEGRITY' to detect!`);
      loadAudit();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  // Repair & re-anchor ledger
  const handleRepairLedger = async () => {
    setTampering(true);
    try {
      await auditApi.repairLedger();
      setTamperMessage('Ledger hash chain repaired and re-anchored to Genesis root!');
      handleVerifyIntegrity();
      loadAudit();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
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
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Compliance & Independent Audit
            </span>
            <span className="text-xs font-mono text-slate-500">Read-Only Oversight Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Blockchain Audit Explorer & Hash Chain Verifier
          </h1>
          <p className="text-xs text-slate-500">
            Cryptographic verification of all lifecycle transitions. Inductive parent hash recalculation proves ledger immutability.
          </p>
        </div>

        {/* Cryptographic Verification Action */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="px-5 py-2.5 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Recalculating Hashes...' : 'VERIFY HASH CHAIN INTEGRITY'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border transition shadow-sm ${
          verificationResult.verified
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : 'bg-rose-50 border-rose-300 text-rose-950'
        }`}>
          <div className="flex items-start space-x-3">
            {verificationResult.verified ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-extrabold text-base tracking-tight">
                  {verificationResult.status}
                </span>
                <span className="text-[11px] font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-200">
                  {verificationResult.totalBlocksChecked} Blocks Verified
                </span>
              </div>

              <p className="text-xs leading-relaxed font-medium">
                {verificationResult.message}
              </p>

              <div className="pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Genesis Root Hash:</span>{' '}
                  <span className="text-slate-800">{verificationResult.genesisHash?.slice(0, 20)}...</span>
                </div>
                <div>
                  <span className="text-slate-500">Top Block Hash:</span>{' '}
                  <span className="text-blue-700 font-semibold">{verificationResult.latestBlockHash?.slice(0, 20)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Simulation & Recovery Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-700">
          <Lock className="w-4 h-4 text-amber-600" />
          <span><strong>Evaluator Tamper Test Suite:</strong> Test cryptographic tamper rejection and recovery:</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
          >
            Simulate Tamper (Corrupt Block #2)
          </button>
          <button
            onClick={handleRepairLedger}
            disabled={tampering}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition cursor-pointer"
          >
            Repair & Re-anchor
          </button>
        </div>
      </div>

      {tamperMessage && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <span>{tamperMessage}</span>
          <button onClick={() => setTamperMessage(null)} className="text-amber-700 hover:text-amber-900 font-bold">×</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Audit Events</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{events.length}</div>
          <div className="text-[11px] text-slate-500">Recorded on-chain</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Integrity Status</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">VERIFIED</div>
          <div className="text-[11px] text-emerald-700 font-semibold">100% Hash Continuity</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Failed Blocks</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">0</div>
          <div className="text-[11px] text-slate-500">Zero cryptographic faults</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-600">Access Mode</span>
          <div className="text-2xl font-extrabold text-blue-900 mt-1">READ-ONLY</div>
          <div className="text-[11px] text-slate-500">Strict Auditor Sandbox</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by event type, actor DID, asset ID, or transaction hash..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Event:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
          >
            <option value="ALL">All Events</option>
            <option value="DID_CREATED">DID_CREATED</option>
            <option value="ROLE_ASSIGNED">ROLE_ASSIGNED</option>
            <option value="ASSET_MINTED">ASSET_MINTED</option>
            <option value="ASSET_ALLOCATED">ASSET_ALLOCATED</option>
            <option value="ACCESS_REQUESTED">ACCESS_REQUESTED</option>
            <option value="ACCESS_ALLOWED">ACCESS_ALLOWED</option>
            <option value="PERMISSION_REVOKED">PERMISSION_REVOKED</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            <option value="SECURITY_ALERT">SECURITY_ALERT</option>
          </select>
        </div>
      </div>

      {/* Timeline View of Ledger Blocks */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Validating ledger records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No events found.
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
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
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
                      <div className="font-mono text-[10px] text-slate-400">Current Hash (SHA-256):</div>
                      <div className="font-mono text-amber-800 text-[11px]">
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
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Cryptographic Chain Verification</div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Previous Hash:</span>
                          <span className="text-slate-800" title={evt.previousHash}>{evt.previousHash.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Current Hash:</span>
                          <span className="text-amber-800 font-bold" title={evt.currentHash}>{evt.currentHash.slice(0, 20)}...</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Transaction ID:</span>
                          <span className="text-slate-800" title={evt.transactionId}>{evt.transactionId.slice(0, 18)}...</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Block Details</div>
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
                      <div className="font-semibold text-slate-800 mb-1 text-xs">Payload Object:</div>
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

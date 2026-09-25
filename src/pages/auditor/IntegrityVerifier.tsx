import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Layers, 
  Flame, 
  Wrench, 
  Download, 
  FileCheck2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../services/api';
import { LedgerEvent, IntegrityVerificationResult } from '../../types';

export const IntegrityVerifier: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<IntegrityVerificationResult | null>(null);
  const [tampering, setTampering] = useState(false);
  const [tamperMessage, setTamperMessage] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLedgerData();
  }, []);

  const loadLedgerData = async () => {
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
      loadLedgerData();
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      const res = await auditApi.simulateTamper();
      setTamperMessage(`Tamper simulated on Block #${res.blockIndex}. Click 'Verify Hash Chain' to detect cryptographic chain break!`);
      loadLedgerData();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  const handleRepairLedger = async () => {
    setTampering(true);
    try {
      await auditApi.repairLedger();
      setTamperMessage('Ledger repaired and re-anchored to Genesis root!');
      handleVerifyIntegrity();
      loadLedgerData();
    } catch (e) {
      console.error(e);
    } finally {
      setTampering(false);
    }
  };

  const handleExportAttestation = () => {
    const cert = {
      title: 'Cryptographic Ledger Integrity Attestation',
      auditorDid: user?.did || 'did:chainidentity:auditor2026',
      auditorName: user?.name || 'Independent Auditor',
      verifiedTimestamp: new Date().toISOString(),
      totalBlocksVerified: verificationResult?.totalBlocksChecked || events.length,
      status: verificationResult?.verified ? 'VALID_CRYPTOGRAPHIC_CONSENSUS' : 'TAMPER_DETECTED',
      ledgerRootHash: events[events.length - 1]?.currentHash || '',
      genesisHash: events[0]?.currentHash || '',
      algorithm: 'SHA-256 / W3C DID Standard',
    };

    const blob = new Blob([JSON.stringify(cert, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-integrity-attestation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Compliance & Proof of Immutability
            </span>
            <span className="text-xs font-mono text-slate-500">SHA-256 Inductive Verification</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Cryptographic Integrity Verifier
          </h1>
          <p className="text-xs text-slate-500">
            Recalculate parent hash linkages across all historical blocks to mathematically prove ledger tamper-resistance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportAttestation}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Attestation</span>
          </button>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="px-5 py-2 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Recalculating Hashes...' : 'Verify Hash Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div className={`p-5 rounded-2xl border transition shadow-xs ${
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
                  {verificationResult.totalBlocksChecked} Blocks Checked
                </span>
              </div>

              <p className="text-xs leading-relaxed font-medium">
                {verificationResult.message}
              </p>

              {verificationResult.failureIndex !== null && (
                <div className="text-xs font-mono font-bold bg-rose-200/60 p-2 rounded-lg text-rose-900">
                  Discrepancy detected at Block #{verificationResult.failureIndex}: {verificationResult.failureReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Proof-of-Immutability Test Bench */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Tamper-Resistance Test Bench
              </span>
              <span className="text-xs text-slate-500">Security Verification Laboratory</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              Simulate Block Tamper & Cryptographic Self-Healing
            </h3>
            <p className="text-xs text-slate-500">
              Demonstrate that any retroactive alteration to ledger payload instantly breaks the SHA-256 parent hash chain.
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <button
              onClick={handleSimulateTamper}
              disabled={tampering}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Simulate Block Tamper</span>
            </button>
            <button
              onClick={handleRepairLedger}
              disabled={tampering}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Repair & Re-Anchor</span>
            </button>
          </div>
        </div>

        {tamperMessage && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{tamperMessage}</span>
          </div>
        )}
      </div>

      {/* Block-by-Block Cryptographic Hash Chain Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Block-by-Block Cryptographic Hash Chain</h3>
            <p className="text-xs text-slate-500">Every block is cryptographically bound to its parent block hash</p>
          </div>
          <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            {events.length} Blocks Anchored
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {events.map((e) => {
            const isExpanded = expandedBlock === e.index;
            return (
              <div key={e.eventId} className="p-4 hover:bg-slate-50/70 transition space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 font-mono font-bold flex items-center justify-center text-xs shrink-0 border border-amber-200">
                      #{e.index}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{e.eventType}</span>
                        {e.assetId && (
                          <span className="font-mono text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {e.assetId}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Actor: {e.actorDid}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-start sm:self-auto">
                    <div className="text-right text-[11px] font-mono text-slate-500 hidden md:block">
                      <div>Timestamp: {new Date(e.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">Tx: {e.transactionId.slice(0, 12)}...</div>
                    </div>

                    <button
                      onClick={() => setExpandedBlock(isExpanded ? null : e.index)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Hashes' : 'Inspect Hashes'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">SHA-256 Block Hash:</span>
                      <div className="text-slate-800 break-all font-semibold">{e.currentHash}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Parent Previous Hash:</span>
                      <div className="text-slate-800 break-all font-semibold">{e.previousHash}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Payload Data:</span>
                      <pre className="mt-1 p-2 bg-slate-900 text-emerald-400 rounded-lg overflow-x-auto text-[11px]">
                        {JSON.stringify(e.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Fingerprint, 
  Boxes, 
  FileText, 
  ExternalLink, 
  ShieldX, 
  Cpu, 
  Check, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { securityApi, assetsApi } from '../../services/api';
import { SecurityAlert } from '../../types';

export const InvestigationCenter: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'INVESTIGATING' | 'RESOLVED'>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await securityApi.getAlerts();
      setAlerts(data);
      if (!selectedAlert && data.length > 0) {
        setSelectedAlert(data[0]);
        setInvestigationNotes(data[0].investigationNotes || '');
      } else if (selectedAlert) {
        const refreshed = data.find((a) => a.id === selectedAlert.id);
        if (refreshed) {
          setSelectedAlert(refreshed);
          setInvestigationNotes(refreshed.investigationNotes || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlert = (alert: SecurityAlert) => {
    setSelectedAlert(alert);
    setInvestigationNotes(alert.investigationNotes || '');
    setActionSuccess(null);
  };

  const handleSaveNotes = async (newStatus: 'INVESTIGATING' | 'RESOLVED') => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      await securityApi.investigateAlert(selectedAlert.id, {
        status: newStatus,
        notes: investigationNotes,
      });
      setActionSuccess(`Case #${selectedAlert.id.slice(0, 8)} updated to ${newStatus}. Notes recorded to audit log.`);
      loadIncidents();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleImmediateRevoke = async () => {
    if (!selectedAlert || !selectedAlert.assetId || !selectedAlert.userDid) return;
    setActionLoading(true);
    try {
      await assetsApi.revoke(
        selectedAlert.assetId,
        selectedAlert.userDid,
        `Emergency revocation via Investigation Case #${selectedAlert.id.slice(0, 8)}: Anomaly score ${selectedAlert.anomalyScore}/100`
      );
      await securityApi.investigateAlert(selectedAlert.id, {
        status: 'RESOLVED',
        notes: `${investigationNotes}\n[SYSTEM ENFORCEMENT]: Immediate permission revocation dispatched and confirmed on blockchain ledger.`,
      });
      setActionSuccess(`Access revoked for ${selectedAlert.userName || selectedAlert.userDid} on ${selectedAlert.assetId}. Revocation committed to blockchain.`);
      loadIncidents();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const userName = a.userName || '';
    const userDid = a.userDid || '';
    const assetId = a.assetId || '';
    const reason = a.reason || '';

    const matchesSearch = 
      userName.toLowerCase().includes(search.toLowerCase()) ||
      userDid.toLowerCase().includes(search.toLowerCase()) ||
      assetId.toLowerCase().includes(search.toLowerCase()) ||
      reason.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Forensic Investigation Center
            </span>
            <span className="text-xs font-mono text-slate-500">SecOps Incident Response</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Security Incident & Threat Cases
          </h1>
          <p className="text-xs text-slate-500">
            Investigate high-risk anomalies, examine blockchain forensic trails, and execute immediate policy revocations.
          </p>
        </div>

        <button
          onClick={loadIncidents}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Incidents</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main 2-Column Split: Cases List & Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cases List (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search cases by DID, user, asset..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600"
              />
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-[11px]">
              {(['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer shrink-0 ${
                    statusFilter === st
                      ? 'bg-purple-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                No incident cases match the criteria.
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = selectedAlert?.id === alert.id;
                return (
                  <div
                    key={alert.id}
                    onClick={() => handleSelectAlert(alert)}
                    className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          alert.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.riskLevel === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.riskLevel} RISK • {alert.anomalyScore}/100
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          alert.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : alert.status === 'INVESTIGATING'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900 line-clamp-1">{alert.reason}</div>
                    
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700">{alert.userName || alert.userDid}</span>
                      </div>
                      <span className="font-mono text-[10px] text-purple-700 font-semibold">{alert.assetId}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Case Dossier (Right 7 Cols) */}
        <div className="lg:col-span-7">
          {selectedAlert ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              {/* Dossier Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-400">Case Ref: {selectedAlert.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedAlert.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedAlert.riskLevel} SEVERITY
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedAlert.reason}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Detection Model</div>
                  <div className="text-xs font-semibold text-purple-900 flex items-center space-x-1">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>AI Behavioral Daemon</span>
                  </div>
                </div>
              </div>

              {/* Forensic Details Matrix */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Subject</span>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedAlert.userName}</div>
                  <div className="font-mono text-[10px] text-slate-500 truncate" title={selectedAlert.userDid}>
                    {selectedAlert.userDid}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Digital Asset</span>
                  <div className="font-bold text-purple-900 mt-0.5">{selectedAlert.assetId}</div>
                  <div className="text-[11px] text-slate-600">Confidential Defense Spec</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Threat Anomaly Score</span>
                  <div className="text-lg font-extrabold text-rose-600 mt-0.5">
                    {selectedAlert.anomalyScore} / 100
                  </div>
                  <div className="text-[10px] text-slate-500">Off-hours frequency threshold exceeded</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Incident Timestamp</span>
                  <div className="font-medium text-slate-700 mt-0.5">
                    {new Date(selectedAlert.createdAt).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Synced to Ledger Time</div>
                </div>
              </div>

              {/* Investigation Notes & Security Actions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Officer Forensic Notes & Assessment
                </label>
                <textarea
                  rows={4}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  placeholder="Record investigation findings, threat mitigation, or interview logs..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-purple-600 leading-relaxed"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleImmediateRevoke}
                  disabled={actionLoading || selectedAlert.status === 'RESOLVED'}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
                  title="Immediately revokes asset permission and writes REVOCATION to ledger"
                >
                  <ShieldX className="w-3.5 h-3.5" />
                  <span>Immediate Revocation Enforcement</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSaveNotes('INVESTIGATING')}
                    disabled={actionLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Save as Investigating
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveNotes('RESOLVED')}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve & Close Case</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select an incident case from the left panel to inspect forensic details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

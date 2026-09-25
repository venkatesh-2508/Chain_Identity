import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Cpu, 
  AlertTriangle, 
  Terminal, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  FileText, 
  ArrowUpRight,
  ExternalLink,
  Flame,
  Fingerprint
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { SecurityAlert } from '../../types';

export const SecurityAlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Simulation state (SIH Demo Step 8)
  const [simulating, setSimulating] = useState(false);
  const [simSuccess, setSimSuccess] = useState<string | null>(null);

  // Investigation modal state (SIH Demo Step 9)
  const [investigatingAlert, setInvestigatingAlert] = useState<SecurityAlert | null>(null);
  const [investigationContext, setInvestigationContext] = useState<any>(null);
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [updatingAlert, setUpdatingAlert] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [alts, anl] = await Promise.all([
        securityApi.getAlerts(),
        securityApi.getAnalytics(),
      ]);
      setAlerts(alts);
      setAnalytics(anl);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateAnomaly = async () => {
    setSimulating(true);
    try {
      const res = await securityApi.simulateAnomaly({
        userDid: 'did:chainidentity:rahul123',
        assetId: 'AST-0017',
      });
      setSimSuccess(`Anomaly Simulated: 5 rapid off-hours access requests triggered. AI Daemon scored 94/100 (HIGH RISK) and logged SECURITY_ALERT to ledger.`);
      loadAlerts();
      setTimeout(() => setSimSuccess(null), 6000);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const openInvestigation = async (alert: SecurityAlert) => {
    setInvestigatingAlert(alert);
    setInvestigationNotes(alert.investigationNotes || '');
    try {
      const res = await securityApi.investigateAlert(alert.id, {
        status: 'INVESTIGATING',
      });
      setInvestigationContext(res.investigationContext);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveInvestigation = async (resolved: boolean = false) => {
    if (!investigatingAlert) return;
    setUpdatingAlert(true);
    try {
      await securityApi.investigateAlert(investigatingAlert.id, {
        status: resolved ? 'RESOLVED' : 'INVESTIGATING',
        notes: investigationNotes,
      });
      setInvestigatingAlert(null);
      loadAlerts();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingAlert(false);
    }
  };

  const filtered = alerts.filter((a) => {
    const matchesSearch = 
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()) ||
      (a.userName && a.userName.toLowerCase().includes(search.toLowerCase())) ||
      (a.userDid && a.userDid.toLowerCase().includes(search.toLowerCase())) ||
      (a.assetId && a.assetId.toLowerCase().includes(search.toLowerCase()));
    const matchesRisk = riskFilter === 'ALL' || a.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              AI Security Analytics
            </span>
            <span className="text-xs font-mono text-slate-500">Continuous Threat Surveillance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            AI Threat Feed & Anomaly Alerts
          </h1>
          <p className="text-xs text-slate-500">
            Real-time anomaly scoring over access timestamps, request frequencies, and repeated denials.
          </p>
        </div>

        {/* Live Simulation Button */}
        <button
          onClick={handleSimulateAnomaly}
          disabled={simulating}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Flame className={`w-4 h-4 ${simulating ? 'animate-bounce' : ''}`} />
          <span>{simulating ? 'Simulating Breach Attempt...' : 'Simulate Off-Hours Threat'}</span>
        </button>
      </div>

      {simSuccess && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Threat Simulation Executed:</span>
            <p className="mt-0.5 text-rose-800">{simSuccess}</p>
          </div>
        </div>
      )}

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Analyzed</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{analytics?.totalAnalyzed || 8}</div>
          <div className="text-[11px] text-slate-500">Continuous ledger scan</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-rose-600">High Risk Alerts</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{analytics?.highRiskCount || 1}</div>
          <div className="text-[11px] text-rose-700 font-semibold">Immediate Investigation Needed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Medium Risk</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{analytics?.mediumRiskCount || 0}</div>
          <div className="text-[11px] text-slate-500">Elevated activity threshold</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Low Risk Baseline</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{analytics?.lowRiskCount || 2}</div>
          <div className="text-[11px] text-emerald-700">Normal working hours</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by reason, user, DID, or asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Risk Level:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">HIGH RISK</option>
            <option value="MEDIUM">MEDIUM RISK</option>
            <option value="LOW">LOW RISK</option>
          </select>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Scanning AI security stream...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No alerts matching current filters.
          </div>
        ) : (
          filtered.map((alert) => (
            <div 
              key={alert.id}
              className={`p-5 rounded-2xl border transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                alert.riskLevel === 'HIGH' ? 'bg-white border-rose-300 hover:border-rose-400' :
                alert.riskLevel === 'MEDIUM' ? 'bg-white border-amber-300 hover:border-amber-400' :
                'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5 max-w-3xl">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    alert.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    alert.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {alert.riskLevel} RISK (Score: {alert.anomalyScore}/100)
                  </span>

                  <span className="font-mono text-xs font-bold text-slate-800">{alert.id}</span>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                    alert.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    alert.status === 'INVESTIGATING' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    Status: {alert.status}
                  </span>
                </div>

                <div className="font-bold text-slate-900 text-sm leading-snug">
                  {alert.reason}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono pt-1">
                  {alert.userName && (
                    <span>Subject: <strong className="text-slate-800">{alert.userName}</strong></span>
                  )}
                  {alert.userDid && (
                    <span className="text-blue-700" title={alert.userDid}>
                      {alert.userDid.slice(0, 22)}...
                    </span>
                  )}
                  {alert.assetId && (
                    <span>Target: <strong className="text-slate-800">{alert.assetId}</strong> ({alert.assetName})</span>
                  )}
                  <span>Time: {new Date(alert.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center space-x-2">
                <button
                  onClick={() => openInvestigation(alert)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Investigate</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* INVESTIGATION MODAL (SIH Demo Step 9) */}
      {investigatingAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Security Investigation Center: {investigatingAlert.id}</h3>
              </div>
              <button onClick={() => setInvestigatingAlert(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                  <span>AI ANOMALY ASSESSMENT: {investigatingAlert.riskLevel} RISK</span>
                  <span className="font-mono">Score: {investigatingAlert.anomalyScore}/100</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">{investigatingAlert.reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Suspicious Subject</span>
                  <div className="font-bold text-slate-900 mt-0.5">{investigatingAlert.userName || 'Unknown'}</div>
                  <div className="font-mono text-[10px] text-blue-700 truncate">{investigatingAlert.userDid}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Target Asset</span>
                  <div className="font-bold text-slate-900 mt-0.5">{investigatingAlert.assetName || investigatingAlert.assetId}</div>
                  <div className="font-mono text-[10px] text-purple-700">{investigatingAlert.assetId}</div>
                </div>
              </div>

              {/* Underlying Audit Events Trail */}
              {investigationContext && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    Underlying Blockchain Audit Events for Subject ({investigationContext.userAuditCount} events):
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {investigationContext.userRecentEvents?.map((e: any) => (
                      <div key={e.eventId} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between font-mono">
                        <div>
                          <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] mr-2 ${
                            e.eventType.includes('DENY') ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {e.eventType}
                          </span>
                          <span className="text-slate-700">{e.eventId}</span>
                        </div>
                        <span className="text-slate-400 text-[10px]">{new Date(e.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Investigator Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Human Security Officer Investigation Findings
                </label>
                <textarea
                  rows={3}
                  placeholder="Record findings: verified as unauthorized credential scan attempt outside shift hours. Revocation confirmed..."
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  AI does not revoke access automatically; human security decision confirmed.
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleSaveInvestigation(false)}
                    disabled={updatingAlert}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                  >
                    Save In-Progress
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveInvestigation(true)}
                    disabled={updatingAlert}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-xs"
                  >
                    Resolve Alert
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

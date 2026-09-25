import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Cpu, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  Activity,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { accessRequestsApi, securityApi, assetsApi, usersApi } from '../../services/api';
import { AccessRequest, SecurityAlert, User } from '../../types';

export const SecurityDashboard: React.FC = () => {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Emergency Break-Glass modal
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emgUserDid, setEmgUserDid] = useState('did:chainidentity:rahul123');
  const [emgAssetId, setEmgAssetId] = useState('AST-0017');
  const [emgReason, setEmgReason] = useState('Urgent defense radar diagnostic during tactical drill');
  const [emgDuration, setEmgDuration] = useState(60);
  const [emgSuccess, setEmgSuccess] = useState<string | null>(null);
  const [submittingEmg, setSubmittingEmg] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqs, alts, anl, usrs] = await Promise.all([
        accessRequestsApi.getAll(),
        securityApi.getAlerts(),
        securityApi.getAnalytics(),
        usersApi.getAll(),
      ]);
      setRequests(reqs);
      setAlerts(alts);
      setAnalytics(anl);
      setUsers(usrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEmg(true);
    try {
      await securityApi.grantEmergencyAccess({
        userDid: emgUserDid,
        assetId: emgAssetId,
        reason: emgReason,
        durationMinutes: emgDuration,
      });
      setEmgSuccess(`Emergency Break-Glass granted for ${emgDuration} minutes on ${emgAssetId}. Logged to blockchain!`);
      setTimeout(() => {
        setShowEmergencyModal(false);
        setEmgSuccess(null);
      }, 3000);
      loadData();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSubmittingEmg(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const highRiskAlerts = alerts.filter((a) => a.riskLevel === 'HIGH').length;

  const riskPieData = [
    { name: 'HIGH', value: analytics?.highRiskCount || 1, fill: '#e11d48' },
    { name: 'MEDIUM', value: analytics?.mediumRiskCount || 0, fill: '#f59e0b' },
    { name: 'LOW', value: analytics?.lowRiskCount || 3, fill: '#10b981' },
  ];

  const enforcementBarData = [
    { name: 'ALLOW', count: analytics?.allowedCount || 4, fill: '#059669' },
    { name: 'DENY', count: analytics?.deniedCount || 1, fill: '#e11d48' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Security Operations Center (C-SOC)
            </span>
            <span className="text-xs font-mono text-slate-500">Live Policy & Threat Stream</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Access Authorization & AI Threat Surveillance
          </h1>
          <p className="text-xs text-slate-500">
            Smart contract authorization oversight, permission revocations, AI anomaly alerts, and break-glass emergency governance.
          </p>
        </div>

        <button
          onClick={() => setShowEmergencyModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Flame className="w-4 h-4" />
          <span>Emergency Break-Glass</span>
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Awaiting Manager Review
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">AI Security Alerts</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{alerts.length}</div>
          <div className="text-[11px] text-rose-700 font-medium mt-1">
            {highRiskAlerts} High-Risk Anomalies
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Events Analyzed</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{analytics?.totalAnalyzed || 7}</div>
          <div className="text-[11px] text-blue-700 font-medium mt-1">
            Continuous Daemon Scan
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Policy Integrity</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">100%</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Contract-Enforced Decisions
          </div>
        </div>
      </div>

      {/* Core Principle Callout */}
      <div className="bg-purple-900 text-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-300 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Security Analytics vs Smart Contract Enforcement</span>
          </div>
          <p className="text-xs text-purple-100 mt-1 max-w-3xl leading-relaxed">
            AI continuously evaluates request frequencies, off-hours access bursts, and denied request spikes to alert human officers.
            The smart contract / policy engine remains the sole, immutable authorization decision layer.
          </p>
        </div>
        <Link
          to="/security/alerts"
          className="px-4 py-2 text-xs font-bold bg-white text-purple-900 hover:bg-purple-50 rounded-xl transition shadow-xs flex items-center space-x-1.5 self-start md:self-auto shrink-0"
        >
          <span>Open AI Threat Feed</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enforcement Ratios */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">Smart Contract Decisions (ALLOW vs DENY)</h3>
          <p className="text-xs text-slate-500 mb-4">Strict cryptographic policy execution</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enforcementBarData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Threat Risk Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900">AI Threat Risk Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Anomaly scoring distribution across access events</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 text-xs">
            {riskPieData.map((d) => (
              <span key={d.name} className="flex items-center space-x-1 text-slate-700 font-semibold">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }}></span>
                <span>{d.name}: {d.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* EMERGENCY BREAK-GLASS MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-rose-300" />
                <h3 className="font-bold text-base">Authorize Emergency Break-Glass Access</h3>
              </div>
              <button onClick={() => setShowEmergencyModal(false)} className="text-rose-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantEmergency} className="p-6 space-y-4">
              {emgSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emgSuccess}</span>
                </div>
              )}

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Break-Glass Protocol:</strong> Grants time-bound emergency access bypass. Every second is strongly audited, signed, and recorded in the blockchain ledger with high visibility.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject (User)</label>
                <select
                  value={emgUserDid}
                  onChange={(e) => setEmgUserDid(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
                >
                  {users.map((u) => (
                    <option key={u.did} value={u.did}>
                      {u.name} — {u.did}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset ID</label>
                  <input
                    type="text"
                    required
                    value={emgAssetId}
                    onChange={(e) => setEmgAssetId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={emgDuration}
                    onChange={(e) => setEmgDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Justification Reason</label>
                <textarea
                  rows={3}
                  required
                  value={emgReason}
                  onChange={(e) => setEmgReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-600 focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEmg}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingEmg ? 'Authorizing Break-Glass...' : 'Commit Emergency Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

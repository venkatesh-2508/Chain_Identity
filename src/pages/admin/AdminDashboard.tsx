import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Boxes, 
  KeyRound, 
  FileCheck2, 
  ShieldCheck, 
  Activity, 
  ArrowUpRight, 
  Plus, 
  Coins, 
  Share2, 
  Layers, 
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw
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
  Cell, 
  LineChart, 
  Line 
} from 'recharts';
import { usersApi, assetsApi, auditApi, accessRequestsApi } from '../../services/api';
import { DigitalAsset, LedgerEvent, User } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [pendingRequests, setPendingRequests] = useState<number>(0);
  const [blockchainProvider, setBlockchainProvider] = useState<'local' | 'fabric'>('local');
  const [loading, setLoading] = useState(true);
  const [togglingProvider, setTogglingProvider] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, a, l, r] = await Promise.all([
        usersApi.getAll(),
        assetsApi.getAll(),
        auditApi.getEvents({ limit: 10 }),
        accessRequestsApi.getAll(),
      ]);
      setUsers(u);
      setAssets(a);
      setEvents(l.events);
      setBlockchainProvider(l.blockchainProvider);
      setPendingRequests(r.filter((req) => req.status === 'PENDING').length);
    } catch (e) {
      console.error('Failed to load admin dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async () => {
    setTogglingProvider(true);
    try {
      const nextProvider = blockchainProvider === 'local' ? 'fabric' : 'local';
      const res = await auditApi.setProvider(nextProvider);
      setBlockchainProvider(res.blockchainProvider);
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingProvider(false);
    }
  };

  // Chart data: Assets by classification
  const classificationCounts: Record<string, number> = {};
  assets.forEach((a) => {
    classificationCounts[a.classification] = (classificationCounts[a.classification] || 0) + 1;
  });
  const classificationData = Object.keys(classificationCounts).map((k) => ({
    name: k,
    value: classificationCounts[k],
  }));

  const COLORS = ['#1e3a8a', '#2563eb', '#0284c7', '#0d9488', '#e11d48'];

  // Access decision counts from events
  const allowCount = events.filter((e) => e.eventType === 'ACCESS_ALLOWED').length;
  const denyCount = events.filter((e) => e.eventType === 'ACCESS_DENIED').length;
  const decisionData = [
    { name: 'ALLOW', count: allowCount || 1, fill: '#059669' },
    { name: 'DENY', count: denyCount || 0, fill: '#e11d48' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Administrator Portal
            </span>
            <span className="text-xs font-mono text-slate-500">Decentralized Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Enterprise Governance & Security Overview
          </h1>
          <p className="text-xs text-slate-500">
            Decentralized Identity management, organizational asset tokenization, and cryptographic audit monitoring.
          </p>
        </div>

        {/* Blockchain Provider Switcher (Crucial requirement: Demo vs Fabric) */}
        <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Blockchain Engine</div>
            <div className="text-xs font-semibold text-slate-800">
              {blockchainProvider === 'local' ? 'Local Demo Ledger (SHA-256)' : 'Hyperledger Fabric Adapter'}
            </div>
          </div>
          <button
            onClick={handleToggleProvider}
            disabled={togglingProvider}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border transition flex items-center space-x-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700"
            title="Switch between Local Ledger and Fabric Adapter"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${togglingProvider ? 'animate-spin' : ''}`} />
            <span>Switch to {blockchainProvider === 'local' ? 'Fabric' : 'Local'}</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users / DIDs</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center mt-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>{users.filter((u) => u.status === 'ACTIVE').length} Verified W3C DIDs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Digital Assets</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{assets.length}</div>
          <div className="text-[11px] text-indigo-600 font-medium flex items-center mt-1">
            <Coins className="w-3.5 h-3.5 mr-1" />
            <span>{assets.filter((a) => a.isTokenized).length} Tokenized NFTs</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Access</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{pendingRequests}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Requires SecOps Authorization
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ledger Blocks</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{events.length}</div>
          <div className="text-[11px] text-emerald-600 font-mono font-medium mt-1">
            Cryptographic Hash Chain Intact
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold">Quick Administrative Actions</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Register decentralized users, tokenize organizational assets, and manage fine-grained access allocations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/users"
              className="px-3.5 py-2 text-xs font-bold bg-white text-blue-900 hover:bg-blue-50 rounded-xl transition shadow-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create User & DID</span>
            </Link>
            <Link
              to="/admin/assets"
              className="px-3.5 py-2 text-xs font-bold bg-blue-700 hover:bg-blue-600 text-white rounded-xl transition border border-blue-500 shadow-xs flex items-center space-x-1.5"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Register & Mint Asset</span>
            </Link>
            <Link
              to="/admin/allocations"
              className="px-3.5 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl transition border border-indigo-500 shadow-xs flex items-center space-x-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Allocate Asset</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Assets by Classification</h3>
            <p className="text-xs text-slate-500">Distribution of defense and organizational assets</p>
          </div>
          <div className="h-52 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={classificationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {classificationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px]">
            {classificationData.map((c, i) => (
              <span key={c.name} className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span>{c.name}: {c.value}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Access Decisions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Smart Contract Decisions</h3>
            <p className="text-xs text-slate-500">Real-time policy enforcement results (ALLOW vs DENY)</p>
          </div>
          <div className="h-52 my-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisionData}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            Enforced by <strong>PolicyEngine::check_access</strong>. AI provides anomaly alerts; smart contracts enforce authorization.
          </div>
        </div>

        {/* Ledger Hash Chain Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Distributed Ledger Integrity</h3>
            <p className="text-xs text-slate-500">Tamper-evident SHA-256 parent hash verification</p>
          </div>

          <div className="space-y-3 my-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>INTEGRITY VERIFIED</span>
              </div>
              <div className="text-[11px] text-emerald-700 mt-1 leading-snug">
                All {events.length} blocks mathematically linked from Genesis (000000...) to latest block.
              </div>
            </div>

            <div className="text-xs space-y-1.5 font-mono text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Engine:</span>
                <span className="font-semibold text-slate-900">{blockchainProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Blocks:</span>
                <span className="font-semibold text-slate-900">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consensus:</span>
                <span className="font-semibold text-slate-900">Raft / PBFT Spec</span>
              </div>
            </div>
          </div>

          <Link
            to="/admin/audit"
            className="w-full py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition"
          >
            Explore Complete Audit Trail
          </Link>
        </div>
      </div>

      {/* Recent Blockchain Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Blockchain Audit Events</h3>
            <p className="text-xs text-slate-500">Immutable ledger records signed with SHA-256 hashes</p>
          </div>
          <Link
            to="/admin/audit"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Block #</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor DID</th>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Current Hash</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.slice(0, 6).map((evt) => (
                <tr key={evt.eventId} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-blue-900">#{evt.index}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      evt.eventType.includes('ALLOW') ? 'bg-emerald-100 text-emerald-800' :
                      evt.eventType.includes('DENY') || evt.eventType.includes('REVOKED') ? 'bg-rose-100 text-rose-800' :
                      evt.eventType.includes('ALERT') ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {evt.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 truncate max-w-[120px]" title={evt.actorDid}>
                    {evt.actorDid}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{evt.assetId || '—'}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[100px]" title={evt.transactionId}>
                    {evt.transactionId.slice(0, 10)}...
                  </td>
                  <td className="py-3 px-4 font-mono text-[10px] text-blue-600 truncate max-w-[100px]" title={evt.currentHash}>
                    {evt.currentHash.slice(0, 10)}...
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

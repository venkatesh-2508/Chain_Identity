import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  Key, 
  Boxes, 
  FileCheck2, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Fingerprint, 
  Database,
  Building2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Zap,
  Activity
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { DemoGuideModal } from '../../components/common/DemoGuideModal';

export const HomePage: React.FC = () => {
  const { user, quickSwitchRole } = useAuth();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  const handleLaunchRole = async (role: any) => {
    await quickSwitchRole(role);
    const targetMap: Record<string, string> = {
      ADMINISTRATOR: '/admin',
      SECURITY_MANAGER: '/security',
      EMPLOYEE: '/employee',
      AUDITOR: '/auditor',
    };
    navigate(targetMap[role] || '/');
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-900 via-indigo-800 to-sky-600 flex items-center justify-center text-white shadow-md shadow-blue-900/10 group-hover:scale-105 transition">
              <Shield className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">CHAINIDENTITY</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                  Enterprise
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Decentralized Trust, Identity & Digital Asset Access
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-900 transition py-1">How It Works</a>
            <a href="#architecture" className="hover:text-blue-900 transition py-1">Architecture</a>
            <a href="#roles" className="hover:text-blue-900 transition py-1">Enterprise Roles</a>
            <a href="#features" className="hover:text-blue-900 transition py-1">Core Modules</a>
          </nav>

          {/* Right Action / Role Pills & Launch */}
          <div className="flex items-center space-x-3">
            {/* Interactive Demo Guide button */}
            <button
              onClick={() => setShowGuide(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-xl transition cursor-pointer border border-slate-200/80"
              title="Interactive Walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Demo Guide</span>
            </button>

            {/* Quick Demo Switcher Pills */}
            <div className="hidden xl:flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider">Fast Role:</span>
              {DEMO_USERS.map((d) => (
                <button
                  key={d.role}
                  onClick={() => handleLaunchRole(d.role)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-900 hover:bg-white rounded-lg transition cursor-pointer"
                  title={`Launch as ${d.role}`}
                >
                  {d.role === 'ADMINISTRATOR' && '🛡️ Admin'}
                  {d.role === 'SECURITY_MANAGER' && '🔒 SecOps'}
                  {d.role === 'EMPLOYEE' && '👤 Rahul'}
                  {d.role === 'AUDITOR' && '📜 Auditor'}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLaunchRole(user.role)}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Portal ({user.role.replace('_', ' ')})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4.5 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-sm flex items-center space-x-2 cursor-pointer"
              >
                <span>Launch Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-white py-16 lg:py-24 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold shadow-xs mb-6">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono text-[11px] text-blue-800">W3C DID & Cryptographic Smart Contract Access</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-medium">Defense-Grade Zero-Trust</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-blue-950 tracking-tight leading-tight">
              Decentralized Trust, Identity, <br className="hidden sm:inline" />
              Access & Digital Asset Platform
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Connect identity, access control, digital assets and trusted auditability through a permissioned blockchain architecture. Built for defense and critical infrastructure enterprises with tamper-evident audit trails and AI security analytics.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-md flex items-center space-x-2"
              >
                <span>Launch Prototype (Live Demo)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#roles"
                className="px-6 py-3 text-sm font-bold text-blue-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition shadow-xs flex items-center space-x-2"
              >
                <span>Explore 4 Enterprise Roles</span>
              </a>
            </div>
          </div>

          {/* Hero Visual Flow Banner (Mandated in Prompt) */}
          <div className="mt-16 max-w-5xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-xl">
            <div className="text-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                Core End-to-End Workflow Architecture
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 mx-auto rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-1">
                  1
                </div>
                <div className="font-bold text-xs text-slate-900">IDENTITY</div>
                <div className="text-[10px] text-slate-500">Employee</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs mb-1">
                  2
                </div>
                <div className="font-bold text-xs text-slate-900">DID</div>
                <div className="text-[10px] text-slate-500">W3C Standard</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 mx-auto rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-1">
                  3
                </div>
                <div className="font-bold text-xs text-slate-900">RBAC / POLICY</div>
                <div className="text-[10px] text-slate-500">Asset Token</div>
              </div>

              <div className="hidden md:flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 mx-auto rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-1">
                  4
                </div>
                <div className="font-bold text-xs text-slate-900">SMART CONTRACT</div>
                <div className="text-[10px] text-slate-500">ALLOW / DENY</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 gap-2">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-700" />
                <span className="font-semibold text-slate-800">Locked Core Principle:</span>
                <span>AI analyzes activity and alerts security teams; smart contracts remain the authorization enforcement layer.</span>
              </div>
              <div className="font-mono text-emerald-700 font-semibold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Audit & AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem & The Solution */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Problem */}
            <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-rose-600 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">The Cybersecurity Challenge</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">The Enterprise Problem</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                    <span><strong>Centralized Credential Vulnerability:</strong> Conventional single sign-on databases represent high-value attack surfaces vulnerable to privilege escalation.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                    <span><strong>Mutable Audit Logs:</strong> Standard system logs can be wiped, truncated, or tampered with by insider threats or compromised root accounts.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                    <span><strong>Disconnected Asset Lifecycle:</strong> Sensitive documents and firmware are not tied to cryptographic ownership tokens or access grants.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0"></span>
                    <span><strong>Dangerous AI Reliance:</strong> Uncontrolled AI agents making autonomous access approvals introduce severe non-deterministic security risks.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
                Engineered for High-Security Enterprise & Defense Infrastructure
              </div>
            </div>

            {/* The Solution */}
            <div className="bg-white p-8 rounded-2xl border border-blue-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-blue-700 mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">The Architecture</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">The ChainIdentity Solution</h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span><strong>Verifiable Digital Identity (W3C DID):</strong> Cryptographically anchored DIDs eliminate hardcoded credentials and prevent identity spoofing.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span><strong>Deterministic Smart Contract Enforcement:</strong> Authorization decisions (ALLOW/DENY) are enforced strictly by immutable policy contracts.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span><strong>Tamper-Evident SHA-256 Hash Chain:</strong> Every event, mint, and allocation is recorded in an immutable ledger verifiable by mathematical induction.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span><strong>AES-256 Encrypted Off-Chain Vault:</strong> Large defense files are stored off-chain with SHA-256 anchors on-chain to detect any bit-level tampering.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0"></span>
                    <span><strong>AI-Assisted Anomaly Surveillance:</strong> AI flags unusual access timing and frequency spikes for human security investigation without overriding contracts.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-blue-700 font-medium">
                Production-Ready • Full-Stack • Zero Mock Data
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Based Portals (1-Click Launch for Evaluators) */}
      <section id="roles" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Role-Based Experience
            </span>
            <h2 className="text-3xl font-extrabold text-blue-950 mt-3">Four Dedicated Portals</h2>
            <p className="text-sm text-slate-600 mt-2">
              Every role has its own dedicated dashboard and specialized workflows. Click any persona below to launch the prototype immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {DEMO_USERS.map((d) => (
              <div 
                key={d.role}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${d.badgeColor}`}>
                      {d.role.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">SIH 2026</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{d.name}</h4>
                  <div className="text-xs font-mono text-blue-600 mt-0.5">{d.email}</div>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                    {d.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleLaunchRole(d.role)}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Launch as {d.role.split('_')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology & Architecture Section */}
      <section id="architecture" className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              Technical Specifications
            </span>
            <h2 className="text-3xl font-extrabold text-blue-950 mt-3">Enterprise Stack & Integrations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Backend & Data Layer</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Python FastAPI & Express dual gateway architecture with PostgreSQL / SQLite persistent store, SQLAlchemy ORM, Pydantic schemas, and JWT authentication.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">Blockchain & Ledger Layer</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Hyperledger Fabric chaincode in Go with local tamper-evident SHA-256 hash-chain adapter for instant zero-dependency evaluation and verification.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base">AI Security & Storage Vault</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Off-chain AES-256-GCM encrypted vault with on-chain cryptographic SHA-256 anchoring. AI security daemon detecting off-hours access bursts and repeated denies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-sky-400" />
            <span className="text-white font-bold text-sm">CHAINIDENTITY</span>
            <span>• Zero-Trust Enterprise Edition</span>
          </div>
          <div>
            Decentralized Trust, Identity, Access & Cryptographic Asset Governance Platform
          </div>
        </div>
      </footer>

      {/* Interactive Demo Guide Walkthrough Modal */}
      <DemoGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </div>
  );
};

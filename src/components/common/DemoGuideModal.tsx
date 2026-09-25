import React from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  X, 
  ExternalLink, 
  ShieldAlert, 
  Cpu, 
  Key, 
  FileCode2, 
  UserCheck, 
  FileCheck2,
  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DemoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideModal: React.FC<DemoGuideModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, quickSwitchRole } = useAuth();

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      role: 'ADMINISTRATOR' as const,
      title: 'Admin Creates User & Generates DID',
      desc: 'Create employee "Rahul Kumar" and generate deterministic W3C DID did:chainidentity:rahul123.',
      targetUrl: '/admin/users',
      actionText: 'Open User Management',
      icon: UserCheck,
    },
    {
      step: 2,
      role: 'ADMINISTRATOR' as const,
      title: 'Register & Tokenize Asset (Mint NFT)',
      desc: 'Register "Project A17" (AST-0017) and mint NFT-AST-0017 with on-chain cryptographic anchor.',
      targetUrl: '/admin/assets',
      actionText: 'Open Asset Vault',
      icon: FileCode2,
    },
    {
      step: 3,
      role: 'ADMINISTRATOR' as const,
      title: 'Allocate Asset to Rahul Kumar',
      desc: 'Allocate Project A17 to Rahul Kumar with active EDIT permission; logs ASSET_ALLOCATED to ledger.',
      targetUrl: '/admin/allocations',
      actionText: 'Manage Allocations',
      icon: Key,
    },
    {
      step: 4,
      role: 'EMPLOYEE' as const,
      title: 'Rahul Tests Access → Smart Contract ALLOW',
      desc: 'Login as Rahul Kumar, click "Test EDIT Access" on Project A17 → Smart Contract policy checks active grant → ALLOW with ACCESS_ALLOWED record.',
      targetUrl: '/employee',
      actionText: 'Switch to Rahul & Test Access',
      icon: CheckCircle2,
    },
    {
      step: 5,
      role: 'SECURITY_MANAGER' as const,
      title: 'AI Analytics Observes Normal Baseline',
      desc: 'AI daemon analyzes daytime request pattern and scores as LOW RISK / normal baseline activity.',
      targetUrl: '/security/alerts',
      actionText: 'View AI Analytics',
      icon: Cpu,
    },
    {
      step: 6,
      role: 'SECURITY_MANAGER' as const,
      title: 'Security Manager Revokes EDIT Permission',
      desc: 'Vikram Joshi revokes Rahul\'s EDIT permission on Project A17 → records PERMISSION_REVOKED on blockchain.',
      targetUrl: '/security/permissions',
      actionText: 'Open Permissions & Revoke',
      icon: ShieldAlert,
    },
    {
      step: 7,
      role: 'EMPLOYEE' as const,
      title: 'Rahul Retries Access → Smart Contract DENY',
      desc: 'Login as Rahul Kumar, click "Test EDIT Access" again → Smart contract strictly enforces revocation → DENY with ACCESS_DENIED record!',
      targetUrl: '/employee',
      actionText: 'Switch to Rahul & Verify DENY',
      icon: ShieldAlert,
    },
    {
      step: 8,
      role: 'SECURITY_MANAGER' as const,
      title: 'Trigger Off-Hours Anomaly Burst',
      desc: 'Simulate 5 rapid requests at 02:00 AM (off-hours) → AI anomaly daemon flags HIGH RISK (score 94) and creates SECURITY_ALERT.',
      targetUrl: '/security/alerts',
      actionText: 'Simulate Suspicious Activity',
      icon: Cpu,
    },
    {
      step: 9,
      role: 'SECURITY_MANAGER' as const,
      title: 'Security Manager Investigates Alert',
      desc: 'Click "Investigate" on the high-risk alert → view full transaction trail, burst volume, and AI reasoning.',
      targetUrl: '/security/alerts',
      actionText: 'Investigate Alerts',
      icon: Terminal,
    },
    {
      step: 10,
      role: 'AUDITOR' as const,
      title: 'Auditor Verifies Blockchain Integrity',
      desc: 'Login as Auditor, click "VERIFY INTEGRITY" → mathematically recalculates SHA-256 hash chain from Genesis → INTEGRITY VERIFIED.',
      targetUrl: '/auditor',
      actionText: 'Switch to Auditor & Verify Chain',
      icon: FileCheck2,
    },
  ];

  const handleStepAction = async (targetRole: any, targetUrl: string) => {
    if (user?.role !== targetRole) {
      await quickSwitchRole(targetRole);
    }
    navigate(targetUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-700/50 rounded-lg border border-blue-500/30">
              <FileCheck2 className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-600/60 text-sky-200 tracking-wider">
                  Enterprise Evaluation
                </span>
                <span className="text-xs text-blue-200">10-Step Interactive Script</span>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                ChainIdentity Live Demo Walkthrough
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-blue-200 hover:text-white p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Principle Banner */}
        <div className="bg-sky-50 border-b border-sky-100 px-6 py-3 flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-blue-700 uppercase tracking-wider">LOCKED PRINCIPLE:</span>
            <span>AI analyzes activity and alerts security teams; smart contracts remain the authorization enforcement layer.</span>
          </div>
          <span className="font-mono text-blue-600 font-medium">100% Real API & State</span>
        </div>

        {/* Steps List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCurrentRole = user?.role === s.role;
            return (
              <div 
                key={s.step}
                className={`p-4 rounded-xl border transition flex items-center justify-between ${
                  isCurrentRole ? 'bg-white border-blue-300 shadow-xs' : 'bg-white/70 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3 max-w-2xl">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm border border-blue-200 mt-0.5">
                    {s.step}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {s.role}
                      </span>
                      <h4 className="font-semibold text-slate-900 text-sm">{s.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStepAction(s.role, s.targetUrl)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition shrink-0 ml-4 cursor-pointer"
                >
                  <span>{s.actionText}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Clicking any step automatically switches to the appropriate role and opens the exact page.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};

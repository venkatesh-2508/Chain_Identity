import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Boxes, 
  KeyRound, 
  ShieldCheck, 
  FileSearch, 
  Clock, 
  AlertTriangle, 
  Fingerprint, 
  Sliders, 
  ShieldAlert, 
  Cpu, 
  Compass,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const renderNavLinks = () => {
    switch (user.role) {
      case 'ADMINISTRATOR':
        return (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Administration & Governance
            </div>
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin Overview</span>
            </NavLink>

            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Users className="w-4 h-4" />
              <span>Users & DIDs</span>
            </NavLink>

            <NavLink
              to="/admin/assets"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Boxes className="w-4 h-4" />
              <span>Digital Assets & NFTs</span>
            </NavLink>

            <NavLink
              to="/admin/allocations"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <KeyRound className="w-4 h-4" />
              <span>Asset Allocations</span>
            </NavLink>

            <NavLink
              to="/admin/audit"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <FileSearch className="w-4 h-4" />
              <span>System Ledger Audit</span>
            </NavLink>
          </>
        );

      case 'SECURITY_MANAGER':
        return (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Security Operations Center
            </div>
            <NavLink
              to="/security"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>SecOps Overview</span>
            </NavLink>

            <NavLink
              to="/security/requests"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Access Requests</span>
            </NavLink>

            <NavLink
              to="/security/permissions"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Sliders className="w-4 h-4" />
              <span>Permissions & Revocation</span>
            </NavLink>

            <NavLink
              to="/security/alerts"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Cpu className="w-4 h-4" />
              <span>AI Anomaly Alerts</span>
            </NavLink>

            <NavLink
              to="/security/investigations"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-purple-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Investigation Center</span>
            </NavLink>
          </>
        );

      case 'EMPLOYEE':
        return (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Employee Workspace
            </div>
            <NavLink
              to="/employee"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>My Workspace</span>
            </NavLink>

            <NavLink
              to="/employee/assets"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Boxes className="w-4 h-4" />
              <span>My Allocated Assets</span>
            </NavLink>

            <NavLink
              to="/employee/access-requests"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <KeyRound className="w-4 h-4" />
              <span>Request Asset Access</span>
            </NavLink>

            <NavLink
              to="/employee/history"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-emerald-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Clock className="w-4 h-4" />
              <span>My Access History</span>
            </NavLink>
          </>
        );

      case 'AUDITOR':
        return (
          <>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Compliance & Ledger Audit
            </div>
            <NavLink
              to="/auditor"
              end
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Compass className="w-4 h-4" />
              <span>Audit Explorer</span>
            </NavLink>

            <NavLink
              to="/auditor/verification"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <FileCheck className="w-4 h-4" />
              <span>Integrity Verifier</span>
            </NavLink>

            <NavLink
              to="/auditor/assets"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive ? 'bg-amber-800 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Boxes className="w-4 h-4" />
              <span>Asset Lifecycle Trails</span>
            </NavLink>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-1">
        {/* User Identity Chip */}
        <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-4 h-4 text-blue-700" />
            <span className="text-[11px] font-bold text-slate-900 truncate">{user.name}</span>
          </div>
          <div className="mt-1 font-mono text-[10px] text-slate-500 truncate" title={user.did}>
            {user.did}
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
              {user.role}
            </span>
            <span className="text-emerald-700 font-semibold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>VERIFIED DID</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        {renderNavLinks()}
      </div>

    </aside>
  );
};

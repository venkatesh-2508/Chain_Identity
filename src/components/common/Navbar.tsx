import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Bell, 
  LogOut, 
  Check, 
  User as UserIcon, 
  Key, 
  Layers, 
  RefreshCw,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, auditApi } from '../../services/api';
import { AppNotification, UserRole } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async () => {
    try {
      await notificationsApi.markRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand & BEL Crest */}
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-900 to-indigo-700 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                  <Shield className="w-6 h-6 text-sky-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-lg text-blue-950 tracking-tight">CHAINIDENTITY</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                      Enterprise
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium tracking-tight">
                    Decentralized Identity & Access Governance Gateway
                  </div>
                </div>
              </Link>
            </div>

            {/* Right: Actions & User Info */}
            <div className="flex items-center space-x-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">System Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkRead}
                          className="text-[11px] text-blue-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">No notifications</div>
                      ) : (
                        notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className={`p-3 text-xs ${n.read ? 'bg-white' : 'bg-blue-50/50'}`}>
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-900">{n.title}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1 text-[11px]">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              {user ? (
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                    <div className="text-[10px] font-mono text-blue-600">{user.did.slice(0, 22)}...</div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition"
                >
                  Sign In
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>
    </>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, UserCheck, Key, AlertCircle } from 'lucide-react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, quickSwitchRole, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@chainidentity.demo');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      // Navigate based on selected email
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('security')) navigate('/security');
      else if (email.includes('rahul')) navigate('/employee');
      else if (email.includes('auditor')) navigate('/auditor');
      else navigate('/admin');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid credentials or connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = async (role: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await quickSwitchRole(role);
      const targetMap: Record<UserRole, string> = {
        ADMINISTRATOR: '/admin',
        SECURITY_MANAGER: '/security',
        EMPLOYEE: '/employee',
        AUDITOR: '/auditor',
      };
      navigate(targetMap[role]);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to switch demo role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 items-center justify-center text-white shadow-md mb-4">
          <Shield className="w-7 h-7 text-sky-300" />
        </div>
        <h2 className="text-2xl font-extrabold text-blue-950 tracking-tight">
          ChainIdentity Enterprise Gateway
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Role Switcher */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Quick Role Access:
              </span>
              <span className="text-[11px] text-blue-600 font-medium">Instant 1-Click Login</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => handleDemoFill(d.role)}
                  disabled={submitting}
                  className="p-3 text-left rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group cursor-pointer disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      {d.role.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-700 group-hover:translate-x-0.5 transition" />
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">{d.name}</div>
                  <div className="text-[10px] font-mono text-blue-600 truncate mt-1">{d.email}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold tracking-wider">
                Or Sign In With Credentials
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="admin@bel.co.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Verifying Decryption Credentials...' : 'Sign In to Portal'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Authentication via JSON Web Tokens (JWT)</span>
            <span className="font-mono text-emerald-600 font-medium">Bcrypt Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
};

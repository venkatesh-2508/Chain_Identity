import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Fingerprint, 
  ShieldCheck, 
  FileCode, 
  Check, 
  X, 
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { usersApi } from '../../services/api';
import { User, DIDDocument } from '../../types';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDidDoc, setSelectedDidDoc] = useState<DIDDocument | null>(null);
  const [copiedDid, setCopiedDid] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'password123',
    role: 'EMPLOYEE',
    department: 'Defense Radar & Tactical Systems',
    organization: 'Enterprise Defense Division',
    customDidSuffix: '',
  });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const res = await usersApi.create(formData);
      setCreateSuccess(`Successfully created user ${res.user.name} with DID: ${res.user.did}`);
      setUsers((prev) => [...prev, res.user]);
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: 'password123',
        role: 'EMPLOYEE',
        department: 'Defense Radar & Tactical Systems',
        organization: 'Enterprise Defense Division',
        customDidSuffix: '',
      });
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 1800);
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'Failed to create user and DID');
    } finally {
      setCreating(false);
    }
  };

  const handleViewDidDoc = async (did: string) => {
    try {
      const res = await usersApi.getDid(did);
      setSelectedDidDoc(res.didDocument);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(text);
    setTimeout(() => setCopiedDid(null), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.did.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Identity Management
            </span>
            <span className="text-xs font-mono text-slate-500">W3C Decentralized Identifiers</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Users & Verifiable DIDs
          </h1>
          <p className="text-xs text-slate-500">
            Provision cryptographically backed Decentralized Identifiers (DIDs), assign RBAC roles, and inspect W3C DID documents.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create User & Generate DID</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, DID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMINISTRATOR">Administrator</option>
            <option value="SECURITY_MANAGER">Security Manager</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="AUDITOR">Auditor</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Decentralized Identifier (DID)</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department / Org</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-blue-800 bg-blue-50/80 px-2 py-1 rounded-lg border border-blue-100 max-w-max">
                        <Fingerprint className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate max-w-[200px]">{u.did}</span>
                        <button
                          onClick={() => copyToClipboard(u.did)}
                          className="text-slate-400 hover:text-blue-900 transition p-0.5"
                          title="Copy DID"
                        >
                          {copiedDid === u.did ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMINISTRATOR' ? 'bg-blue-100 text-blue-800' :
                        u.role === 'SECURITY_MANAGER' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'AUDITOR' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-800 font-medium">{u.department}</div>
                      <div className="text-[10px] text-slate-400">{u.organization}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-emerald-700 font-semibold text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewDidDoc(u.did)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <FileCode className="w-3 h-3" />
                        <span>DID Doc</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-base">Create User & Anchor DID</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-blue-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {createSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@chainidentity.demo"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="SECURITY_MANAGER">Security Manager</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom DID Suffix (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. rahul123"
                    value={formData.customDidSuffix}
                    onChange={(e) => setFormData({ ...formData, customDidSuffix: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Decentralized Trust Action:</div>
                <div>• Generates W3C DID document with Ed25519 verification method</div>
                <div>• Writes immutable <strong>DID_CREATED</strong> block to distributed ledger</div>
                <div>• Writes immutable <strong>ROLE_ASSIGNED</strong> block to distributed ledger</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {creating ? 'Anchoring to Blockchain...' : 'Generate & Anchor DID'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW W3C DID DOCUMENT MODAL */}
      {selectedDidDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden">
            <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm font-mono truncate max-w-md">
                  {selectedDidDoc.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDidDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
                <span className="font-semibold">W3C Decentralized Identifier Specification Document</span>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedDidDoc, null, 2))}
                  className="text-blue-700 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-sky-300 font-mono text-xs rounded-xl overflow-x-auto max-h-96">
                {JSON.stringify(selectedDidDoc, null, 2)}
              </pre>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2">
                <span>Controller: {selectedDidDoc.controller}</span>
                <button
                  onClick={() => setSelectedDidDoc(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

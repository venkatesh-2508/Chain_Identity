import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Plus, 
  Coins, 
  KeyRound, 
  Upload, 
  ShieldCheck, 
  FileText, 
  Check, 
  X, 
  Search, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { assetsApi, usersApi, storageApi } from '../../services/api';
import { DigitalAsset, User } from '../../types';

export const AssetManagement: React.FC = () => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<DigitalAsset | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<DigitalAsset | null>(null);

  // Forms
  const [createData, setCreateData] = useState({
    assetId: '',
    name: '',
    description: '',
    assetType: 'PROJECT',
    classification: 'CONFIDENTIAL',
  });

  const [allocUserDid, setAllocUserDid] = useState('did:chainidentity:rahul123');
  const [allocPermissions, setAllocPermissions] = useState<string[]>(['VIEW', 'EDIT']);

  const [uploadFilename, setUploadFilename] = useState('');
  const [uploadContent, setUploadContent] = useState('');

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [a, u] = await Promise.all([assetsApi.getAll(), usersApi.getAll()]);
      setAssets(a);
      setUsers(u);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setActionError(null);
    try {
      const newAsset = await assetsApi.create(createData);
      setAssets((prev) => [...prev, newAsset]);
      setActionSuccess(`Asset ${newAsset.name} (${newAsset.assetId}) registered and logged to ledger.`);
      setShowCreateModal(false);
      setCreateData({
        assetId: '',
        name: '',
        description: '',
        assetType: 'PROJECT',
        classification: 'CONFIDENTIAL',
      });
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to create asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleTokenize = async (asset: DigitalAsset) => {
    setProcessing(true);
    setActionError(null);
    try {
      const res = await assetsApi.tokenize(asset.assetId);
      setAssets((prev) => prev.map((a) => (a.assetId === asset.assetId ? res.asset : a)));
      setActionSuccess(`Asset Minted: Token ${res.asset.tokenId} anchored on blockchain! Tx: ${res.transaction.transactionId.slice(0, 16)}...`);
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to tokenize asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAllocateModal) return;
    setProcessing(true);
    setActionError(null);

    try {
      const res = await assetsApi.allocate(showAllocateModal.assetId, allocUserDid, allocPermissions);
      setActionSuccess(`Allocated ${showAllocateModal.name} to ${res.allocation.userName} with [${allocPermissions.join(', ')}] access.`);
      setShowAllocateModal(null);
      loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to allocate asset');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadOffchain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUploadModal) return;
    setProcessing(true);
    setActionError(null);

    try {
      const b64 = btoa(uploadContent);
      const res = await storageApi.uploadPayload({
        assetId: showUploadModal.assetId,
        filename: uploadFilename || `${showUploadModal.assetId}-spec.dat`,
        contentBase64: b64,
        mimeType: 'application/octet-stream',
      });
      setActionSuccess(`Off-chain payload encrypted with AES-256-GCM. SHA-256 Hash ${res.sha256Hash.slice(0, 16)}... anchored to ledger!`);
      setShowUploadModal(null);
      setUploadFilename('');
      setUploadContent('');
      loadData();
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err?.response?.data?.error || 'Failed to upload off-chain payload');
    } finally {
      setProcessing(false);
    }
  };

  const togglePermission = (perm: string) => {
    if (allocPermissions.includes(perm)) {
      setAllocPermissions(allocPermissions.filter((p) => p !== perm));
    } else {
      setAllocPermissions([...allocPermissions, perm]);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch = 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetId.toLowerCase().includes(search.toLowerCase()) ||
      a.tokenId.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === 'ALL' || a.classification === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Asset Lifecycle & Tokenization
            </span>
            <span className="text-xs font-mono text-slate-500">Organizational NFTs</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Digital Asset Management
          </h1>
          <p className="text-xs text-slate-500">
            Register organizational assets, mint cryptographic tokens (NFTs), manage allocations, and store encrypted payloads off-chain.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition shadow-xs flex items-center space-x-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Asset</span>
        </button>
      </div>

      {/* Global Alerts */}
      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by asset name, ID (e.g. AST-0017), or token..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Classification:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          >
            <option value="ALL">All Classifications</option>
            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="TOP_SECRET">TOP_SECRET</option>
            <option value="INTERNAL">INTERNAL</option>
            <option value="PUBLIC">PUBLIC</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssets.map((asset) => (
          <div 
            key={asset.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {asset.assetId}
                </span>

                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  asset.classification === 'TOP_SECRET' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                  asset.classification === 'CONFIDENTIAL' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                  asset.classification === 'RESTRICTED' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {asset.classification}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{asset.name}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{asset.description}</p>

              {/* Token & Off-chain Info */}
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Token ID:</span>
                  <span className="text-indigo-700 font-bold">{asset.tokenId}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-semibold ${asset.isTokenized ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {asset.status}
                  </span>
                </div>
                {asset.offchainHash && (
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    <span>SHA-256 Vault Hash:</span>
                    <span className="text-blue-600 font-semibold" title={asset.offchainHash}>
                      {asset.offchainHash.slice(0, 14)}...
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between">
              <div>
                {!asset.isTokenized ? (
                  <button
                    onClick={() => handleTokenize(asset)}
                    disabled={processing}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Mint NFT Token</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Tokenized on Chain</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setShowUploadModal(asset)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                  title="Upload encrypted payload to off-chain vault"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Vault</span>
                </button>

                <button
                  onClick={() => setShowAllocateModal(asset)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Allocate</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REGISTER ASSET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-base">Register Organizational Asset</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset ID (e.g. AST-0017)</label>
                  <input
                    type="text"
                    required
                    placeholder="AST-0099"
                    value={createData.assetId}
                    onChange={(e) => setCreateData({ ...createData, assetId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Classification</label>
                  <select
                    value={createData.classification}
                    onChange={(e) => setCreateData({ ...createData, classification: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  >
                    <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                    <option value="TOP_SECRET">TOP_SECRET</option>
                    <option value="INTERNAL">INTERNAL</option>
                    <option value="PUBLIC">PUBLIC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project A17 or Tactical Radar Firmware"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Type</label>
                <select
                  value={createData.assetType}
                  onChange={(e) => setCreateData({ ...createData, assetType: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="PROJECT">Project</option>
                  <option value="DOCUMENT">Document / Technical Spec</option>
                  <option value="SOFTWARE_LICENSE">Software License / Firmware</option>
                  <option value="EQUIPMENT">Equipment Record</option>
                  <option value="ENTERPRISE_RESOURCE">Enterprise Resource</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe defense scope, mission profile, or operational parameters..."
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
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
                  disabled={processing}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {processing ? 'Registering...' : 'Register Asset on Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALLOCATE ASSET MODAL */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-sky-300" />
                <h3 className="font-bold text-base">Allocate Asset: {showAllocateModal.name}</h3>
              </div>
              <button onClick={() => setShowAllocateModal(null)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Subject (User / DID)</label>
                <select
                  value={allocUserDid}
                  onChange={(e) => setAllocUserDid(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono"
                >
                  {users.map((u) => (
                    <option key={u.did} value={u.did}>
                      {u.name} ({u.role}) — {u.did}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Granted Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {['VIEW', 'EDIT', 'TRANSFER', 'ALLOCATE'].map((perm) => (
                    <label
                      key={perm}
                      className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold cursor-pointer transition ${
                        allocPermissions.includes(perm)
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allocPermissions.includes(perm)}
                        onChange={() => togglePermission(perm)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Smart Contract Allocation Record:</div>
                <div>• Generates immutable <strong>ASSET_ALLOCATED</strong> block on distributed ledger</div>
                <div>• Grants subject DID authorization token for requested permissions</div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || allocPermissions.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {processing ? 'Recording Allocation...' : 'Grant & Commit Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD ENCRYPTED OFF-CHAIN PAYLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-indigo-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">Off-chain Encrypted Storage Vault</h3>
              </div>
              <button onClick={() => setShowUploadModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadOffchain} className="p-6 space-y-4">
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-blue-900">
                <strong>Zero On-Chain Sensitive Storage:</strong> Raw payloads are encrypted with AES-256-GCM and stored off-chain. Only the cryptographic SHA-256 hash reference is recorded on the blockchain ledger!
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payload / Document Filename</label>
                <input
                  type="text"
                  required
                  placeholder={`${showUploadModal.assetId}-firmware-spec.bin`}
                  value={uploadFilename}
                  onChange={(e) => setUploadFilename(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payload Content (Secret Text / Config)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter classified defense specifications, firmware coefficients, or system configuration..."
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-800 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {processing ? 'Encrypting & Anchoring...' : 'Encrypt (AES-256) & Anchor Hash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

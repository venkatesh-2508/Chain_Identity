import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  FileCheck2, 
  KeyRound, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { assetsApi, auditApi } from '../../services/api';
import { DigitalAsset, LedgerEvent } from '../../types';

export const AssetLifecycleTrails: React.FC = () => {
  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [events, setEvents] = useState<LedgerEvent[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('AST-0017');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAssets, auditData] = await Promise.all([
        assetsApi.getAll(),
        auditApi.getEvents(),
      ]);
      setAssets(allAssets);
      setEvents(auditData.events);
      if (allAssets.length > 0 && !selectedAssetId) {
        setSelectedAssetId(allAssets[0].assetId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find((a) => a.assetId === selectedAssetId);

  // Filter events related to selected asset
  const assetEvents = events.filter((e) => {
    if (e.assetId === selectedAssetId) return true;
    if (e.payload?.assetId === selectedAssetId) return true;
    return false;
  }).sort((a, b) => a.index - b.index);

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.assetId.toLowerCase().includes(search.toLowerCase()) ||
    a.classification.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Audit & Provenance
            </span>
            <span className="text-xs font-mono text-slate-500">End-to-End Asset Traceability</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Asset Lifecycle & Provenance Trails
          </h1>
          <p className="text-xs text-slate-500">
            Inspect the unbroken cryptographic lifecycle chain of any digital asset from token minting to allocation, access checks, and revocation.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition flex items-center space-x-1.5 shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Provenance Data</span>
        </button>
      </div>

      {/* 2-Column Split: Asset Selector (Left) & Lifecycle Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Asset Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search assets by name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredAssets.map((a) => {
              const isSelected = a.assetId === selectedAssetId;
              const relatedCount = events.filter((e) => e.assetId === a.assetId || e.payload?.assetId === a.assetId).length;

              return (
                <div
                  key={a.assetId}
                  onClick={() => setSelectedAssetId(a.assetId)}
                  className={`p-4 rounded-2xl border transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-600/20 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{a.name}</span>
                    <span className="font-mono text-[10px] text-amber-800 font-semibold">{a.assetId}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                      {a.classification}
                    </span>
                    <span className="font-mono text-[10px] text-slate-600">
                      {relatedCount} Lifecycle Block{relatedCount === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Lifecycle Provenance Chain (8 cols) */}
        <div className="lg:col-span-8">
          {selectedAsset ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              {/* Asset Dossier Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-slate-400">{selectedAsset.assetId}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {selectedAsset.classification}
                    </span>
                    {selectedAsset.isTokenized && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        NFT Tokenized
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedAsset.name}</h3>
                </div>

                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Total Lifecycle Transitions</div>
                  <div className="text-xl font-extrabold text-amber-800">{assetEvents.length} Verified Events</div>
                </div>
              </div>

              {/* Provenance Chain Timeline */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Cryptographic Timeline & Hash Links
                </h4>

                {assetEvents.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No ledger transactions recorded yet for this asset.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-amber-200 ml-4 pl-6 space-y-6">
                    {assetEvents.map((evt, idx) => {
                      const isAllowed = evt.eventType === 'ACCESS_ALLOWED' || evt.eventType === 'ASSET_ALLOCATED' || evt.eventType === 'ASSET_MINTED';
                      const isDenied = evt.eventType === 'ACCESS_DENIED' || evt.eventType === 'PERMISSION_REVOKED';

                      return (
                        <div key={evt.eventId} className="relative group">
                          {/* Timeline dot */}
                          <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                            isAllowed 
                              ? 'border-emerald-500' 
                              : isDenied 
                              ? 'border-rose-500' 
                              : 'border-amber-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isAllowed ? 'bg-emerald-500' : isDenied ? 'bg-rose-500' : 'bg-amber-500'
                            }`}></div>
                          </div>

                          {/* Event Card */}
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                                  Block #{evt.index}
                                </span>
                                <span className="font-bold text-xs text-slate-900">{evt.eventType}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {new Date(evt.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <div className="text-xs text-slate-700">
                              <span className="text-slate-500 font-semibold">Actor Identity:</span>{' '}
                              <span className="font-mono">{evt.actorDid}</span>
                            </div>

                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 space-y-1">
                              <div className="truncate">
                                <span className="text-slate-400">Tx Hash:</span> {evt.transactionId}
                              </div>
                              <div className="truncate">
                                <span className="text-slate-400">Block Hash:</span> {evt.currentHash}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              Select an asset to view its complete cryptographic lifecycle trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

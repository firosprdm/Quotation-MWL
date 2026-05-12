'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building2, 
  Plus, 
  Trash2, 
  TrendingDown,
  DollarSign,
  Play,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import styles from '@/app/assets/assets.module.css';

export function FixedAssetRegister() {
  const { fixedAssets, accounts, addFixedAsset, runDepreciation } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [runningDep, setRunningDep] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [newAsset, setNewAsset] = useState({
    name: '',
    purchaseDate: Date.now(),
    cost: 0,
    salvageValue: 0,
    usefulLife: 5,
    depreciationMethod: 'Straight Line' as const,
    category: 'Equipment' as const,
    accountId: '',
    accumulatedDepreciationAccountId: 'acc-28',
    depreciationExpenseAccountId: 'acc-29'
  });

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.cost || !newAsset.accountId) return;
    addFixedAsset({
      ...newAsset,
      status: 'Active'
    });
    setShowAddModal(false);
    setNewAsset({
      name: '',
      purchaseDate: Date.now(),
      cost: 0,
      salvageValue: 0,
      usefulLife: 5,
      depreciationMethod: 'Straight Line',
      category: 'Equipment',
      accountId: '',
      accumulatedDepreciationAccountId: 'acc-28',
      depreciationExpenseAccountId: 'acc-29'
    });
  };

  const handleRunDepreciation = async () => {
    const date = new Date();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    setRunningDep(true);
    await runDepreciation(month, year);
    setRunningDep(false);
    setSuccessMsg(`Depreciation for ${month}/${year} processed!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-medium flex items-center gap-3">
          <Building2 className="text-blue-400" size={24} />
          Asset Management
        </h3>
        <div className="flex gap-4">
          <button 
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            onClick={handleRunDepreciation}
            disabled={runningDep}
          >
            {runningDep ? 'Processing...' : <><Play size={14} /> Run Depreciation</>}
          </button>
          <button 
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={14} /> Add Asset
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 animate-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="font-medium text-sm">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="glass-panel p-6 flex items-center gap-5 border-l-4 border-blue-500 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] border border-white/5 group-hover:border-blue-500/30 relative z-10">
            <Building2 size={24} className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] text-muted font-medium uppercase tracking-widest mb-1">Total Assets</p>
            <p className="text-2xl font-medium text-white">
              {formatCurrency(fixedAssets.reduce((acc, a) => acc + a.cost, 0))}
            </p>
          </div>
          <div className="absolute top-2 right-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <Building2 size={48} className="text-blue-500" />
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-5 border-l-4 border-red-500 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] border border-white/5 group-hover:border-red-500/30 relative z-10">
            <TrendingDown size={24} className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] text-muted font-medium uppercase tracking-widest mb-1">Accum. Dep.</p>
            <p className="text-2xl font-medium text-white">
              {formatCurrency(accounts.find(a => a.code === '1690')?.balance || 0)}
            </p>
          </div>
          <div className="absolute top-2 right-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <TrendingDown size={48} className="text-red-500" />
          </div>
        </div>
        
        <div className="glass-panel p-6 flex items-center gap-5 border-l-4 border-emerald-500 group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 transition-all duration-500 group-hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] border border-white/5 group-hover:border-emerald-500/30 relative z-10">
            <ShieldCheck size={24} className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" />
          </div>
          <div className="relative z-10">
            <p className="text-[12px] text-muted font-medium uppercase tracking-widest mb-1">Net Book Value</p>
            <p className="text-2xl font-medium text-emerald-400">
              {formatCurrency(
                fixedAssets.reduce((acc, a) => acc + a.cost, 0) + (accounts.find(a => a.code === '1690')?.balance || 0)
              )}
            </p>
          </div>
          <div className="absolute top-2 right-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={48} className="text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Asset Details</th>
                <th>Category</th>
                <th>Purchased</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Monthly Dep.</th>
              </tr>
            </thead>
            <tbody>
              {fixedAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-24 text-muted/30">
                    <Building2 size={40} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-normal uppercase tracking-widest">Register is empty</p>
                  </td>
                </tr>
              ) : (
                fixedAssets.map(asset => {
                  const monthlyDep = (asset.cost - asset.salvageValue) / (asset.usefulLife * 12);
                  return (
                    <tr key={asset.id} className="group hover:bg-white/[0.03] transition-colors border-b border-white/5">
                      <td className="whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-white">{asset.name}</span>
                          <span className="text-muted uppercase mt-0.5">ID: {asset.id.slice(0,8)}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="uppercase text-muted">
                          {asset.category}
                        </span>
                      </td>
                      <td className="font-mono text-muted/60 whitespace-nowrap">
                        {new Date(asset.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-mono text-white">
                          {formatCurrency(asset.cost)}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span className="font-mono text-blue-400">
                          {formatCurrency(monthlyDep)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-xl shadow-2xl animate-in zoom-in-95">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-blue-500/[0.05]">
              <h3 className="text-xl font-medium uppercase tracking-widest flex items-center gap-3">
                <Plus className="text-blue-400" /> New Asset
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-muted hover:text-white transition-colors">
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleAddAsset} className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium uppercase tracking-widest text-muted mb-2">Asset Name</label>
                  <input 
                    type="text" required value={newAsset.name}
                    onChange={e => setNewAsset({...newAsset, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                    placeholder="e.g. Server Rack A"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-normal uppercase tracking-widest text-muted mb-2">Category</label>
                    <select 
                      value={newAsset.category}
                      onChange={e => setNewAsset({...newAsset, category: e.target.value as any})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                    >
                      <option value="Equipment">Equipment</option>
                      <option value="Vehicles">Vehicles</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Building">Building</option>
                      <option value="IT">IT Infrastructure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal uppercase tracking-widest text-muted mb-2">Purchase Date</label>
                    <input 
                      type="date" required
                      onChange={e => setNewAsset({...newAsset, purchaseDate: new Date(e.target.value).getTime()})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-normal uppercase tracking-widest text-muted mb-2">Cost</label>
                    <input 
                      type="number" required value={newAsset.cost || ''}
                      onChange={e => setNewAsset({...newAsset, cost: parseFloat(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-normal uppercase tracking-widest text-muted mb-2">Useful Life (Years)</label>
                    <input 
                      type="number" required value={newAsset.usefulLife || ''}
                      onChange={e => setNewAsset({...newAsset, usefulLife: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-normal uppercase tracking-widest text-muted mb-2">Asset Account</label>
                  <select 
                    required value={newAsset.accountId}
                    onChange={e => setNewAsset({...newAsset, accountId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 outline-none"
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(a => a.type === 'Asset').map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button type="submit" className="btn-primary w-full py-4 text-sm font-normal uppercase tracking-widest">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

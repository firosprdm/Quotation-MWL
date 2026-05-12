'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, Trash2, Edit2, TrendingUp, X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { formatCurrency } from '@/lib/format';
import { PurchaseInvoice } from '@/types';

export default function PurchaseInvoicesPage() {
  const { purchaseInvoices, suppliers, quotations, addPurchaseInvoice, updatePurchaseInvoice, deletePurchaseInvoice, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<PurchaseInvoice, 'id' | 'number'>>({
    supplierId: '',
    date: Date.now(),
    dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    items: [],
    subtotal: 0,
    vatRate: 15,
    vatAmount: 0,
    grandTotal: 0,
    status: 'draft',
    notes: '',
    projectId: ''
  });

  const filteredInvoices = purchaseInvoices.filter(inv => {
    const s = suppliers.find(sup => sup.id === inv.supplierId);
    return (
      inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'unpaid': return <Clock size={14} className="text-amber-400" />;
      case 'overdue': return <XCircle size={14} className="text-rose-400" />;
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  const handleAmountChange = (subtotal: number) => {
    const vatAmount = subtotal * 0.15;
    const grandTotal = subtotal + vatAmount;
    setFormData(prev => ({ ...prev, subtotal, vatAmount, grandTotal }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }
    
    if (editingId) {
      updatePurchaseInvoice(editingId, formData);
    } else {
      addPurchaseInvoice(formData);
    }
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      supplierId: '',
      date: Date.now(),
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      items: [],
      subtotal: 0,
      vatRate: 15,
      vatAmount: 0,
      grandTotal: 0,
      status: 'draft',
      notes: '',
      projectId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (inv: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(inv.id);
    setFormData({
      supplierId: inv.supplierId,
      date: inv.date,
      dueDate: inv.dueDate,
      items: inv.items,
      subtotal: inv.subtotal,
      vatRate: inv.vatRate,
      vatAmount: inv.vatAmount,
      grandTotal: inv.grandTotal,
      status: inv.status,
      notes: inv.notes || '',
      projectId: inv.projectId || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="fade-in">
      <header className="flex justify-between items-end mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="premium-title">Supplier Bills</h2>
          <p className="premium-subtitle">Manage purchase invoices and accounts payable.</p>
        </div>
        <button 
          className="glass-button flex items-center gap-2 text-sm px-5 py-2.5"
          onClick={openAddModal}
        >
          <Plus size={18} />
          <span>Add Bill</span>
        </button>
      </header>

      <div className="glass-panel flex items-center gap-3 p-3 px-4 rounded-xl mb-6 bg-slate-900/30">
        <Search className="text-white/40" size={20} />
        <input 
          type="text" 
          placeholder="Search bills by number or supplier..." 
          className="bg-transparent border-none outline-none text-white w-full text-sm placeholder:text-white/30"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl mx-12 mb-16 shadow-2xl">
        <div className="grid grid-cols-12 gap-4 py-5 px-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-slate-900/40 items-center">
          <div className="col-span-2">Bill Reference</div>
          <div className="col-span-3">Supplier Name</div>
          <div className="col-span-2">Invoice Date</div>
          <div className="col-span-2 text-right">Total Amount</div>
          <div className="col-span-2 text-center">Payment Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredInvoices.map((inv) => {
            const supplier = suppliers.find(s => s.id === inv.supplierId);
            return (
              <div key={inv.id} className="grid grid-cols-12 gap-4 py-6 px-6 items-center text-[14px] text-white/80 hover:bg-white/[0.03] transition-colors group border-b border-white/[0.02] last:border-0">
                <div className="col-span-2 font-medium text-white">{inv.number}</div>
                <div className="col-span-3 truncate">{supplier?.name || 'Unknown Supplier'}</div>
                <div className="col-span-2 text-white/60">
                  {new Date(inv.date).toLocaleDateString()}
                </div>
                <div className="col-span-2 text-right font-medium text-blue-400">
                  {formatCurrency(inv.grandTotal)}
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 border border-white/5 min-w-[90px] justify-center">
                    {getStatusIcon(inv.status)}
                    <span className="text-[11px] uppercase tracking-wider font-medium text-white/70">
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="col-span-1 flex justify-end gap-3">
                  <button onClick={(e) => openEditModal(inv, e)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all">
                    <Edit2 size={16} />
                  </button>
                  {currentUser?.role === 'admin' && (
                    <button onClick={() => {
                      if(confirm('Are you sure you want to delete this bill?')) {
                        deletePurchaseInvoice(inv.id);
                      }
                    }} className="p-1.5 rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredInvoices.length === 0 && (
            <div className="p-8 text-center text-white/40">
              No supplier bills found.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md transition-all duration-300" onClick={() => setIsModalOpen(false)}>
          <div className="glass-panel w-full max-w-3xl overflow-hidden shadow-2xl scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="relative mb-10 border-b border-white/10 pb-8 text-center">
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  {editingId ? 'Edit Supplier Bill' : 'Record New Supplier Bill'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">Fill in the procurement details and financial breakdown.</p>
                
                <button onClick={() => setIsModalOpen(false)} className="absolute right-0 top-0 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Vendor & Project Section */}
                <section className="space-y-4">
                  <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-widest px-1">1. Entity & Assignment</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Supplier / Vendor</label>
                      <select 
                        className="glass-input w-full bg-slate-900/60 !py-3"
                        required
                        value={formData.supplierId}
                        onChange={e => setFormData({...formData, supplierId: e.target.value})}
                      >
                        <option value="">Choose Supplier...</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Project Link (Optional)</label>
                      <select 
                        className="glass-input w-full bg-slate-900/60 !py-3"
                        value={formData.projectId}
                        onChange={e => setFormData({...formData, projectId: e.target.value})}
                      >
                        <option value="">Internal Business Use</option>
                        {quotations.filter(q => q.status === 'approved').map(q => (
                          <option key={q.id} value={q.id}>{q.number} - {q.projectName || 'Unnamed Project'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                {/* Scheduling Section */}
                <section className="space-y-4">
                  <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest px-1">2. Scheduling & Deadlines</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Bill Issuance Date</label>
                      <input 
                        type="date" 
                        className="glass-input w-full !py-3"
                        value={new Date(formData.date).toISOString().split('T')[0]}
                        onChange={e => setFormData({...formData, date: new Date(e.target.value).getTime()})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Payment Due Date</label>
                      <input 
                        type="date" 
                        className="glass-input w-full !py-3"
                        value={new Date(formData.dueDate).toISOString().split('T')[0]}
                        onChange={e => setFormData({...formData, dueDate: new Date(e.target.value).getTime()})}
                      />
                    </div>
                  </div>
                </section>

                {/* Financial Section */}
                <section className="space-y-4">
                  <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-widest px-1">3. Financial Breakdown</h4>
                  <div className="grid grid-cols-3 gap-6 items-end">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">Subtotal (Net Amount)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/30">SAR</span>
                        <input 
                          type="number" 
                          className="glass-input w-full !pl-12 !py-3 font-mono text-lg"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={formData.subtotal || ''}
                          onChange={e => handleAmountChange(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-400 ml-1">VAT (15%)</label>
                      <input 
                        type="number" 
                        className="glass-input w-full !py-3 opacity-60 font-mono text-lg bg-white/5"
                        readOnly
                        value={formData.vatAmount.toFixed(2)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-blue-400 ml-1">Grand Total (Inclusive)</label>
                      <input 
                        type="number" 
                        className="glass-input w-full !py-3 font-mono text-xl font-bold text-blue-400 bg-blue-500/5 border-blue-500/20"
                        readOnly
                        value={formData.grandTotal.toFixed(2)}
                      />
                    </div>
                  </div>
                </section>

                {/* Meta Section */}
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 ml-1">Current Status</label>
                    <select 
                      className="glass-input w-full bg-slate-900/60 !py-3"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="draft">Draft (Editing)</option>
                      <option value="submitted">Submitted (Waiting)</option>
                      <option value="unpaid">Unpaid (Awaiting Payment)</option>
                      <option value="paid">Paid (Settled)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400 ml-1">Notes / Remarks</label>
                    <input 
                      type="text" 
                      className="glass-input w-full !py-3"
                      placeholder="Reference numbers or comments..."
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-8 border-t border-white/10 mr-6">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="glass-button flex items-center gap-2 px-8 !py-3 text-sm font-medium hover:!bg-white/5 transition-all"
                  >
                    <XCircle size={18} className="text-rose-400/70" />
                    <span>Cancel</span>
                  </button>
                  <button 
                    type="submit" 
                    className="glass-button flex items-center gap-2 !bg-blue-600 !text-white hover:!bg-blue-500 px-10 !py-3 text-sm font-bold shadow-xl shadow-blue-600/30 border-none transition-all active:scale-95 group"
                  >
                    <CheckCircle size={18} className="group-hover:scale-110 transition-transform" />
                    <span>{editingId ? 'Update Bill' : 'Confirm & Save'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

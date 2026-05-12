'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Mail, Phone, MapPin, Trash2, Edit2, Hash, TrendingUp, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import styles from './suppliers.module.css';
import { clsx } from 'clsx';

import { Supplier } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';
import { SupplierDetailsModal } from '@/components/SupplierDetailsModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuppliersPage() {
  const { suppliers, purchaseInvoices, journalEntries, addSupplier, updateSupplier, deleteSupplier, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    supplier: any;
    type: 'confirm' | 'blocked';
    linkedData: { purchaseInvoices: any[]; journalEntries: any[] };
  }>({ open: false, supplier: null, type: 'confirm', linkedData: { purchaseInvoices: [], journalEntries: [] } });
  const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'createdAt'>>({ 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    vatNumber: '',
    otherId: '',
    splitAddress: {
      buildingNumber: '',
      streetName: '',
      district: '',
      city: 'Riyadh',
      postalCode: '',
      countryCode: 'SA'
    }
  });

  const filteredSuppliers = suppliers.filter(c => {
    const name = c.name || '';
    const email = c.email || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ZATCA Phase 2 Validation
    if (formData.vatNumber) {
      if (!formData.vatNumber.startsWith('3') || formData.vatNumber.length !== 15) {
        alert('Buyer VAT Number must be 15 digits and start with 3.');
        return;
      }
    }

    if (formData.splitAddress) {
      const { buildingNumber, postalCode } = formData.splitAddress;
      if (buildingNumber && !/^\d{4}$/.test(buildingNumber)) {
        alert('Building Number must be exactly 4 digits.');
        return;
      }
      if (postalCode && !/^\d{5}$/.test(postalCode)) {
        alert('Postal Code must be exactly 5 digits.');
        return;
      }
    }

    if (editingId) {
      updateSupplier(editingId, formData);
    } else {
      addSupplier(formData);
    }
    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      address: '', 
      vatNumber: '',
      otherId: '',
      splitAddress: {
        buildingNumber: '',
        streetName: '',
        district: '',
        city: 'Riyadh',
        postalCode: '',
        countryCode: 'SA'
      }
    });
    setEditingId(null);
  };

  const openEditModal = (supplier: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ 
      name: supplier.name, 
      email: supplier.email, 
      phone: supplier.phone, 
      address: supplier.address, 
      vatNumber: supplier.vatNumber || '',
      otherId: supplier.otherId || '',
      splitAddress: supplier.splitAddress || {
        buildingNumber: '',
        streetName: '',
        district: '',
        city: 'Riyadh',
        postalCode: '',
        countryCode: 'SA'
      }
    });
    setEditingId(supplier.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleDeleteClick = (supplier: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const linkedPurchaseInvoices = (purchaseInvoices || []).filter((inv: any) => inv.supplierId === supplier.id || inv.supplierName === supplier.name);
    const linkedJournalEntries = (journalEntries || []).filter((je: any) =>
      je.description?.includes(supplier.name) || je.reference?.includes(supplier.id)
    );
    const hasLinked = linkedPurchaseInvoices.length > 0 || linkedJournalEntries.length > 0;
    setDeleteModal({
      open: true,
      supplier,
      type: hasLinked ? 'blocked' : 'confirm',
      linkedData: { purchaseInvoices: linkedPurchaseInvoices, journalEntries: linkedJournalEntries }
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.supplier) return;
    try {
      await deleteSupplier(deleteModal.supplier.id);
      setDeleteModal(prev => ({ ...prev, open: false }));
    } catch (err: any) {
      setDeleteModal(prev => ({
        ...prev,
        type: 'blocked',
        linkedData: {
          purchaseInvoices: [],
          journalEntries: [{ description: err?.message || String(err), date: Date.now() }]
        }
      }));
    }
  };

  const handleSplitAddressChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      splitAddress: {
        ...(formData.splitAddress || {
          buildingNumber: '',
          streetName: '',
          district: '',
          city: 'Riyadh',
          postalCode: '',
          countryCode: 'SA'
        }),
        [field]: value
      }
    });
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className="premium-title">Supplier Directory</h2>
          <p className="premium-subtitle">Manage your vendor relationships, procurement profiles, and payables.</p>
        </div>
        <button 
          className={clsx('glass-button', styles.addButton)}
          onClick={openAddModal}
        >
          <Plus size={20} />
          <span>Add Supplier</span>
        </button>
      </header>

      <div className={clsx('glass-panel', styles.searchBar)}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          type="text" 
          placeholder="Search suppliers..." 
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <motion.div 
        className={styles.suppliersGrid}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
          }
        }}
      >
        {filteredSuppliers.map((supplier) => (
          <motion.div 
            key={supplier.id} 
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
            className={clsx('glass-panel', styles.supplierCard)}
            onClick={() => setViewingSupplier(supplier)}
            style={{ cursor: 'pointer' }}
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.supplierProfileArea}>
                <div className={styles.avatar}>{supplier.name[0]}</div>
              </div>
              <div className={styles.cardActions}>
                <button 
                  className={styles.actionBtn}
                  onClick={(e) => openEditModal(supplier, e)}
                >
                  <Edit2 size={18} className="icon-hover" />
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    className={clsx(styles.actionBtn, styles.delete)}
                    onClick={(e) => handleDeleteClick(supplier, e)}
                  >
                    <Trash2 size={18} className="icon-hover" />
                  </button>
                )}
              </div>
            </div>
            
            <h3 className="premium-card-title mt-4 px-1">{supplier.name}</h3>
            
            <div className="flex flex-col gap-2.5 mt-4 px-1">
              <div className="flex items-center gap-3 text-[14px] text-white/70">
                <Mail size={15} className="text-blue-400/80" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-3 text-[14px] text-white/70">
                <Phone size={15} className="text-emerald-400/80" />
                <span>{supplier.phone}</span>
              </div>
              {supplier.vatNumber && (
                <div className="flex items-center gap-3 text-[14px] text-white/70">
                  <Hash size={15} className="text-purple-400/80" />
                  <span className="premium-label !text-purple-400/90 !normal-case !tracking-normal">VAT: {supplier.vatNumber}</span>
                </div>
              )}
              {supplier.otherId && (
                <div className="flex items-center gap-3 text-[14px] text-white/70">
                  <Hash size={15} className="text-amber-400/80" />
                  <span className="premium-label !text-amber-400/90 !normal-case !tracking-normal">CR: {supplier.otherId}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-[14px] text-white/70">
                <MapPin size={15} className="text-rose-400/80" />
                <span className="truncate">
                  {supplier.splitAddress ? (
                    `${supplier.splitAddress.buildingNumber}, ${supplier.splitAddress.streetName}, ${supplier.splitAddress.district}, ${supplier.splitAddress.city}`
                  ) : supplier.address}
                </span>
              </div>
            </div>

            {(() => {
              const approvedInvoices = (purchaseInvoices || []).filter(inv => inv.supplierId === supplier.id && inv.status !== 'draft' && inv.status !== 'cancelled');
              if (approvedInvoices.length > 0) {
                const sales = approvedInvoices.reduce((acc, inv) => acc + (inv.grandTotal || 0), 0);
                const received = approvedInvoices.reduce((acc, inv) => acc + (inv.receivedAmount || 0), 0);
                const pending = sales - received;

                const formatNum = (num: number) => {
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                  return num.toLocaleString();
                };

                return (
                  <div className={styles.badgesContainer}>
                    <div className={clsx(styles.statBadge, styles.salesBadge)} title={`Total Bills: ${formatCurrency(sales)}`}>
                      <TrendingUp size={16} /> <span>{formatNum(sales)}</span>
                    </div>
                    <div className={clsx(styles.statBadge, styles.receivedBadge)} title={`Total Paid: ${formatCurrency(received)}`}>
                      <CheckCircle size={16} /> <span>{formatNum(received)}</span>
                    </div>
                    <div className={clsx(styles.statBadge, styles.pendingBadge)} title={`Balance Due: ${formatCurrency(pending)}`}>
                      <Clock size={16} /> <span>{formatNum(pending)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </motion.div>
        ))}
      </motion.div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="grid grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    className="glass-input !py-2.5" 
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>VAT Number (15 Digits)</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    value={formData.vatNumber}
                    onChange={e => setFormData({...formData, vatNumber: e.target.value})}
                    placeholder="3xxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>CR No. / National ID (رقم السجل)</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    value={formData.otherId}
                    onChange={e => setFormData({...formData, otherId: e.target.value})}
                    placeholder="e.g. 1010XXXXXX"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Street Name</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    value={formData.splitAddress?.streetName || ''}
                    onChange={e => handleSplitAddressChange('streetName', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={styles.formGroup}>
                  <label>Building No</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    maxLength={4}
                    value={formData.splitAddress?.buildingNumber || ''}
                    onChange={e => handleSplitAddressChange('buildingNumber', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>District</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    value={formData.splitAddress?.district || ''}
                    onChange={e => handleSplitAddressChange('district', e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Postal Code</label>
                  <input 
                    type="text" 
                    className="glass-input !py-2.5" 
                    maxLength={5}
                    value={formData.splitAddress?.postalCode || ''}
                    onChange={e => handleSplitAddressChange('postalCode', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>City</label>
                  <select 
                    className="glass-input !py-2.5 bg-slate-900/50" 
                    value={formData.splitAddress?.city || 'Riyadh'}
                    onChange={e => handleSplitAddressChange('city', e.target.value)}
                  >
                    <option value="Riyadh">Riyadh</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Khobar">Khobar</option>
                    <option value="Abha">Abha</option>
                    <option value="Tabuk">Tabuk</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Legacy Address (Fallback)</label>
                  <textarea 
                    className="glass-input !py-1" 
                    rows={1}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="glass-button px-6">Cancel</button>
                <button type="submit" className={styles.submitBtn}>{editingId ? 'Update Supplier' : 'Save Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingSupplier && (
        <SupplierDetailsModal 
          supplier={viewingSupplier}
          purchaseInvoices={purchaseInvoices || []}
          onClose={() => setViewingSupplier(null)}
        />
      )}

      {/* ── Smart Delete Modal ─────────────────────────────── */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel w-full max-w-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className={`flex items-center gap-4 p-6 border-b border-white/10 ${deleteModal.type === 'blocked' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
              {deleteModal.type === 'blocked'
                ? <XCircle size={28} className="text-red-400 flex-shrink-0" />
                : <AlertTriangle size={28} className="text-amber-400 flex-shrink-0" />
              }
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {deleteModal.type === 'blocked' ? 'Cannot Delete Supplier' : 'Confirm Delete'}
                </h3>
                <p className="text-sm text-white/60 mt-0.5">{deleteModal.supplier?.name}</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {deleteModal.type === 'blocked' ? (
                <>
                  <p className="text-sm text-white/70">This supplier cannot be deleted because they have linked financial records. Please remove or reassign the following records first:</p>
                  {deleteModal.linkedData.purchaseInvoices.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">Supplier Bills ({deleteModal.linkedData.purchaseInvoices.length})</p>
                      {deleteModal.linkedData.purchaseInvoices.slice(0, 5).map((inv: any, i: number) => (
                        <div key={i} className="text-sm text-white/70 py-1 border-b border-white/5 last:border-0">
                          <span className="text-white/90 font-medium">{inv.number || inv.id}</span> — SAR {(inv.grandTotal || inv.total || 0).toLocaleString()}
                        </div>
                      ))}
                      {deleteModal.linkedData.purchaseInvoices.length > 5 && <p className="text-xs text-white/40 mt-2">...and {deleteModal.linkedData.purchaseInvoices.length - 5} more</p>}
                    </div>
                  )}
                  {deleteModal.linkedData.journalEntries.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2">Ledger Entries ({deleteModal.linkedData.journalEntries.length})</p>
                      {deleteModal.linkedData.journalEntries.slice(0, 5).map((je: any, i: number) => (
                        <div key={i} className="text-sm text-white/70 py-1 border-b border-white/5 last:border-0">
                          <span className="text-white/90 font-medium">{je.reference || 'Journal Entry'}</span> — {je.description}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-white/70">
                  Are you sure you want to permanently delete <span className="text-white font-semibold">{deleteModal.supplier?.name}</span>? This action cannot be undone.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-sm font-medium transition-all"
              >
                {deleteModal.type === 'blocked' ? 'Close' : 'Cancel'}
              </button>
              {deleteModal.type === 'confirm' && (
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Trash2 size={15} />
                  Delete Supplier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

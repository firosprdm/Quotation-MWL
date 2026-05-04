'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Tag, DollarSign, Package, Trash2, Edit2 } from 'lucide-react';
import styles from './inventory.module.css';
import { clsx } from 'clsx';

export default function InventoryPage() {
  const { inventory, addItem, updateItem, deleteItem } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ description: '', unit: '', price: 0 });

  const filteredItems = inventory.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem(editingId, formData);
    } else {
      addItem(formData);
    }
    setFormData({ description: '', unit: '', price: 0 });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openEditModal = (item: any) => {
    setFormData({ description: item.description, unit: item.unit, price: item.price });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ description: '', unit: '', price: 0 });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Inventory</h2>
          <p className={styles.subtitle}>Products and services catalog.</p>
        </div>
        <button 
          className={clsx('glass-button', styles.addButton)}
          onClick={openAddModal}
        >
          <Plus size={20} />
          <span>Add Item</span>
        </button>
      </header>

      <div className={clsx('glass-panel', styles.searchBar)}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          type="text" 
          placeholder="Search items..." 
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.reportSection}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>No items found.</div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className={styles.reportRow}>
              <div className="flex items-center gap-4 flex-1">
                <div className={styles.iconBox}><Tag size={16} className="text-blue-400" /></div>
                <div className="flex flex-col">
                  <span className="text-[14px] text-white tracking-tight">{item.description}</span>
                  <span className="text-[10px] text-muted uppercase tracking-widest">{item.unit}</span>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col text-right w-[120px]">
                  <span className="text-[9px] text-muted uppercase tracking-widest mb-1">Unit Price</span>
                  <span className="font-mono text-[13px] text-emerald-400">
                    SAR {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 rounded-lg hover:bg-white/5 text-muted hover:text-white transition-colors"
                    onClick={() => openEditModal(item)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    className="p-2 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-colors"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Inventory Item' : 'Add Inventory Item'}</h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Description</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Unit (e.g. Hour, PCS, Job)</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  required 
                  value={formData.unit}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Unit Price (SAR)</label>
                <div className={styles.priceInputWrapper}>
                  <span className={styles.currencyIcon}>SAR</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className={clsx('glass-input', styles.priceInput)} 
                    required 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="glass-button px-6">Cancel</button>
                <button type="submit" className={styles.submitBtn}>{editingId ? 'Update Item' : 'Save Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

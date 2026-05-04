'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Tag, DollarSign, Package, Trash2, Edit2 } from 'lucide-react';
import styles from './inventory.module.css';
import { clsx } from 'clsx';

export default function InventoryPage() {
  const { inventory, addItem, updateItem, deleteItem, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ description: '', unit: '', price: 0 });
  const [sortField, setSortField] = useState<'description' | 'unit' | 'price'>('description');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'description' | 'unit' | 'price') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredItems = inventory.filter(i => 
    i.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'price') {
      comparison = a.price - b.price;
    } else {
      comparison = (a[sortField] || '').localeCompare(b[sortField] || '');
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

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

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="opacity-20 ml-1">⇅</span>;
    return <span className="ml-1 text-primary">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
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

      <div className={clsx('glass-panel', styles.tableWrapper)}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => handleSort('description')} className="cursor-pointer hover:text-white transition-colors">
                Description <SortIcon field="description" />
              </th>
              <th onClick={() => handleSort('unit')} className="cursor-pointer hover:text-white transition-colors">
                Unit <SortIcon field="unit" />
              </th>
              <th onClick={() => handleSort('price')} className="cursor-pointer hover:text-white transition-colors">
                Price <SortIcon field="price" />
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyState}>No items found.</td>
              </tr>
            ) : (
              sortedItems.map((item) => (
                <tr key={item.id}>
                  <td className={styles.itemDescription}>
                    <div className={styles.iconBox}><Tag size={16} /></div>
                    {item.description}
                  </td>
                  <td className={styles.itemUnit}>{item.unit}</td>
                  <td className={styles.itemPrice}>SAR {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionBtn}
                        onClick={() => openEditModal(item)}
                      >
                        <Edit2 size={16} />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button 
                          className={clsx(styles.actionBtn, styles.delete)}
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this item?')) {
                              deleteItem(item.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

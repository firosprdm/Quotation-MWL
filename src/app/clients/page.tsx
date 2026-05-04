'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Search, Mail, Phone, MapPin, Trash2, Edit2, Hash, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import styles from './clients.module.css';
import { clsx } from 'clsx';
import { ClientDetailsModal } from '@/components/ClientDetailsModal';
import { Client } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/format';

export default function ClientsPage() {
  const { clients, quotations, addClient, updateClient, deleteClient, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingClient, setViewingClient] = useState<any>(null);
  const [formData, setFormData] = useState<Omit<Client, 'id' | 'createdAt'>>({ 
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

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      updateClient(editingId, formData);
    } else {
      addClient(formData);
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

  const openEditModal = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ 
      name: client.name, 
      email: client.email, 
      phone: client.phone, 
      address: client.address, 
      vatNumber: client.vatNumber || '',
      otherId: client.otherId || '',
      splitAddress: client.splitAddress || {
        buildingNumber: '',
        streetName: '',
        district: '',
        city: 'Riyadh',
        postalCode: '',
        countryCode: 'SA'
      }
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
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
          <h2 className={styles.title}>Clients</h2>
          <p className={styles.subtitle}>Manage your customer relationships.</p>
        </div>
        <button 
          className={clsx('glass-button', styles.addButton)}
          onClick={openAddModal}
        >
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </header>

      <div className={clsx('glass-panel', styles.searchBar)}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          type="text" 
          placeholder="Search clients..." 
          className={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className={styles.clientsGrid}>
        {filteredClients.map((client) => (
          <div 
            key={client.id} 
            className={clsx('glass-panel', styles.clientCard)}
            onClick={() => setViewingClient(client)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.cardHeader}>
              <div className={styles.clientProfileArea}>
                <div className={styles.avatar}>{client.name[0]}</div>
              </div>
              <div className={styles.cardActions}>
                <button 
                  className={styles.actionBtn}
                  onClick={(e) => openEditModal(client, e)}
                >
                  <Edit2 size={16} />
                </button>
                {currentUser?.role === 'admin' && (
                  <button 
                    className={clsx(styles.actionBtn, styles.delete)}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if(confirm('Are you sure you want to delete this client?')) {
                        try {
                          await deleteClient(client.id);
                        } catch (err) {
                          alert('Error deleting client: ' + err);
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <h3 className={styles.clientName}>{client.name}</h3>
            
            <div className={styles.clientInfo}>
              <div className={styles.infoItem}>
                <Mail size={14} />
                <span>{client.email}</span>
              </div>
              <div className={styles.infoItem}>
                <Phone size={14} />
                <span>{client.phone}</span>
              </div>
              {client.vatNumber && (
                <div className={styles.infoItem}>
                  <Hash size={14} className="text-purple-400" />
                  <span>VAT: {client.vatNumber}</span>
                </div>
              )}
              {client.otherId && (
                <div className={styles.infoItem}>
                  <Hash size={14} className="text-amber-400" />
                  <span>CR: {client.otherId}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <MapPin size={14} />
                <span className={styles.address}>
                  {client.splitAddress ? (
                    `${client.splitAddress.buildingNumber}, ${client.splitAddress.streetName}, ${client.splitAddress.district}, ${client.splitAddress.city}, ${client.splitAddress.postalCode}, ${client.splitAddress.countryCode}`
                  ) : client.address}
                </span>
              </div>
            </div>

            {(() => {
              const approvedQs = quotations.filter(q => q.clientId === client.id && q.status === 'approved');
              if (approvedQs.length > 0) {
                const sales = approvedQs.reduce((acc, q) => acc + (q.grandTotal || q.total || 0), 0);
                const received = approvedQs.reduce((acc, q) => acc + (q.receivedAmount || 0), 0);
                const pending = sales - received;

                const formatNum = (num: number) => {
                  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
                  return num.toLocaleString();
                };

                return (
                  <div className={styles.badgesContainer}>
                    <div className={clsx(styles.statBadge, styles.salesBadge)} title={`Sales: ${formatCurrency(sales)}`}>
                      <TrendingUp size={18} /> <span>{formatNum(sales)}</span>
                    </div>
                    <div className={clsx(styles.statBadge, styles.receivedBadge)} title={`Received: ${formatCurrency(received)}`}>
                      <CheckCircle size={18} /> <span>{formatNum(received)}</span>
                    </div>
                    <div className={clsx(styles.statBadge, styles.pendingBadge)} title={`Pending: ${formatCurrency(pending)}`}>
                      <Clock size={18} /> <span>{formatNum(pending)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={clsx('glass-panel', styles.modal)} onClick={e => e.stopPropagation()}>
            <h3>{editingId ? 'Edit Client' : 'Add New Client'}</h3>
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
                <button type="submit" className={styles.submitBtn}>{editingId ? 'Update Client' : 'Save Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingClient && (
        <ClientDetailsModal 
          client={viewingClient} 
          quotations={quotations}
          onClose={() => setViewingClient(null)} 
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Plus, Trash2, Save, ArrowLeft, User, Search, ShoppingCart, FileText } from 'lucide-react';
import styles from '../../quotations/new/new-quotation.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2,8)}`; }

export default function NewInvoicePage() {
  const { clients, inventory, settings, addInvoice } = useApp() as any;
  const router = useRouter();

  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [validity, setValidity] = useState('30');
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState(settings?.defaultNotes || '');
  const [terms, setTerms] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [searchItem, setSearchItem] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  useEffect(() => {
    if (date && validity) {
      const d = new Date(date);
      d.setDate(d.getDate() + parseInt(validity));
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date, validity]);

  const filteredInventory = (inventory || []).filter((i: any) =>
    i.description?.toLowerCase().includes(searchItem.toLowerCase())
  );

  const addFromInventory = (item: any) => {
    const subtotal = item.price || 0;
    setItems(prev => [...prev, {
      id: genId(),
      itemId: item.id,
      description: item.description,
      unit: item.unit || 'Nos',
      quantity: 1,
      price: subtotal,
      total: subtotal,
      vatAmount: subtotal * 0.15,
      totalWithVat: subtotal * 1.15,
    }]);
    setSearchItem('');
    setShowItemResults(false);
  };

  const addManualItem = () => {
    setItems(prev => [...prev, {
      id: genId(),
      itemId: 'manual',
      description: '',
      unit: 'Nos',
      quantity: 1,
      price: 0,
      total: 0,
      vatAmount: 0,
      totalWithVat: 0,
    }]);
  };

  const updateItem = (id: string, updates: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, ...updates };
      updated.total = (updated.quantity || 0) * (updated.price || 0);
      updated.vatAmount = updated.total * 0.15;
      updated.totalWithVat = updated.total + updated.vatAmount;
      return updated;
    }));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const subtotal = items.reduce((s, i) => s + (i.total || 0), 0);
  const netAmount = subtotal - discount;
  const vatAmount = Math.max(0, netAmount * 0.15);
  const grandTotal = Math.max(0, netAmount + vatAmount);

  const handleSave = async () => {
    if (!clientId) return alert('Please select a client');
    if (items.length === 0) return alert('Please add at least one item');
    setIsSaving(true);
    try {
      await addInvoice({
        clientId,
        date: new Date(date).getTime(),
        dueDate: new Date(dueDate).getTime(),
        items,
        subtotal,
        vatRate: 15,
        vatAmount,
        total: netAmount + vatAmount,
        discount,
        grandTotal,
        notes,
        termsAndConditions: terms,
        poNumber,
        ticketNumber,
        subject,
        mwlStatus: 'draft',
        status: 'sent',
        salesStatus: 'PO recieved',
        workStatus: 'Work Done',
      });
      router.push('/invoices');
    } catch (e: any) {
      alert(`Failed to save: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <Link href="/invoices" className={styles.backBtn}><ArrowLeft size={20} /></Link>
          <div>
            <h2 className={styles.title}>New Invoice</h2>
            <p className={styles.subtitle}>Create a standalone tax invoice directly.</p>
          </div>
        </div>
        <button className="glass-button px-6 py-3 flex items-center gap-2" onClick={handleSave} disabled={isSaving}>
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Save Invoice'}
        </button>
      </header>

      <div className={styles.grid}>
        <div className={styles.leftCol}>

          {/* Client + Dates */}
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <User size={20} className="text-blue-400" /><h3>Client & Date</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Client</label>
                <select className={clsx('glass-input', styles.select)} value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Choose a client...</option>
                  {(clients || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Invoice Date</label>
                <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Payment Terms</label>
                <select className="glass-input" value={validity} onChange={e => setValidity(e.target.value)}>
                  <option value="0">Due on Receipt</option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Subject / Title</label>
                <input type="text" className="glass-input" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>PO Number (Optional)</label>
                <input type="text" className="glass-input" value={poNumber} onChange={e => setPoNumber(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Ticket Number (Optional)</label>
                <input type="text" className="glass-input" value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} />
              </div>
            </div>
          </section>

          {/* Line Items */}
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <ShoppingCart size={20} className="text-purple-400" /><h3>Line Items</h3>
            </div>
            <div className={styles.itemSearchWrapper}>
              <div className={styles.itemSearch}>
                <Search className={styles.searchIcon} size={18} />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  className={styles.searchInput}
                  value={searchItem}
                  onChange={e => { setSearchItem(e.target.value); setShowItemResults(true); }}
                  onFocus={() => setShowItemResults(true)}
                />
                {showItemResults && searchItem && (
                  <div className={clsx('glass-panel', styles.searchResults)}>
                    {filteredInventory.length === 0
                      ? <div className={styles.searchResultItem}><span className="text-white/40">No items found</span></div>
                      : filteredInventory.map((item: any) => (
                        <div key={item.id} className={styles.searchResultItem} onClick={() => addFromInventory(item)}>
                          <span>{item.description}</span>
                          <span className="text-blue-400">{item.price}</span>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
              <button className={styles.addCustomBtn} onClick={addManualItem} type="button">
                <Plus size={20} /><span>Add Custom Item</span>
              </button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Description</th><th>Unit</th><th>Qty</th>
                    <th>Unit Price</th><th>Total</th><th>VAT (15%)</th><th>Total (Inc. VAT)</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={8} className="text-center text-white/30 py-8 text-sm">No items added yet</td></tr>
                  )}
                  {items.map(item => (
                    <tr key={item.id}>
                      <td>
                        <input type="text" className={styles.inlineInput} value={item.description}
                          onChange={e => updateItem(item.id, { description: e.target.value })} />
                      </td>
                      <td>
                        <select className={styles.inlineSelect} value={item.unit}
                          onChange={e => updateItem(item.id, { unit: e.target.value })}>
                          <option>Nos</option><option>Lot</option><option>LM</option><option>Sqm</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" className={clsx(styles.inlineInput, styles.center)}
                          value={item.quantity || ''} onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td>
                        <input type="number" className={clsx(styles.inlineInput, styles.right)}
                          value={item.price || ''} onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td className={styles.cellStatic}>{(item.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={styles.cellStatic}>{(item.vatAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={clsx(styles.cellStatic, 'font-medium text-white')}>{(item.totalWithVat || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td><button className={styles.removeBtn} onClick={() => removeItem(item.id)}><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}><FileText size={20} className="text-blue-400" /><h3>Notes</h3></div>
            <textarea className={clsx('glass-input', styles.notes)} rows={4} value={notes} onChange={e => setNotes(e.target.value)} />
          </section>
        </div>

        {/* Summary sidebar */}
        <div className={styles.rightCol}>
          <section className={clsx('glass-panel', styles.summaryCard)}>
            <h3 className={styles.summaryTitle}>Invoice Summary</h3>
            <div className={styles.summaryRow}><span>Subtotal</span><span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className={clsx(styles.summaryRow, 'text-rose-400')}>
              <span>Discount</span>
              <input type="number" className={styles.discountInput} value={discount || ''} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} />
            </div>
            <div className={styles.summaryRow}><span>Net Amount</span><span>{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className={styles.summaryRow}><span>VAT (15%)</span><span>{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div className={clsx(styles.summaryRow, styles.totalRow)}><span>Grand Total</span><span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <button className={styles.saveBtnPrimary} onClick={handleSave} disabled={isSaving || !clientId || items.length === 0}>
              <Save size={20} />{isSaving ? 'Saving...' : 'Save Invoice'}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

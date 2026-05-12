'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Plus, 
  Trash2, 
  FileDown, 
  Save, 
  ArrowLeft,
  Calendar,
  User,
  Search,
  ShoppingCart
} from 'lucide-react';
import styles from '../../new/new-quotation.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '@/components/QuotationPDF';
import { QuotationItem, Quotation } from '@/types';

export default function EditQuotation() {
  const { id } = useParams();
  const { quotations, clients, inventory, updateQuotation, addItem, settings } = useApp();
  const router = useRouter();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState('');
  const [validity, setValidity] = useState('30');
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [quotationNumber, setQuotationNumber] = useState('');
  const [revision, setRevision] = useState(0);
  const [ticketNumber, setTicketNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectAr, setSubjectAr] = useState('');
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!subject) {
      setSubjectAr('');
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          body: JSON.stringify({ text: subject })
        });
        if (res.ok) {
          const data = await res.json();
          setSubjectAr(data.translatedText);
        }
      } catch (e) {
        console.error('Subject translation failed');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [subject]);

  const [searchItem, setSearchItem] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  useEffect(() => {
    const q = quotations.find(item => item.id === id);
    if (q) {
      setSelectedClientId(q.clientId || '');
      setDate(new Date(q.date).toISOString().split('T')[0]);
      
      const hydrate = (itemsArr: any[]) => itemsArr
        .filter((it: any) => !it._isWorkflowMetadata)
        .map((it: any) => ({
          ...it,
          total: it.total ?? (it.quantity || 0) * (it.price || 0),
          vatAmount: it.vatAmount ?? ((it.total ?? (it.quantity || 0) * (it.price || 0)) * 0.15),
          totalWithVat: it.totalWithVat ?? ((it.total ?? (it.quantity || 0) * (it.price || 0)) * 1.15),
        }));

      if (!hasHydrated) {
        const hydratedItems = hydrate(q.items || []);
        if (hydratedItems.length > 0) {
          setItems(hydratedItems);
          setHasHydrated(true);
        } else {
          fetch(`/api/v1/erpnext/quotations?id=${id}`)
            .then(res => res.json())
            .then(fullQ => {
              if (fullQ && fullQ.items && fullQ.items.length > 0) {
                setItems(hydrate(fullQ.items));
                setHasHydrated(true);
              }
            })
            .catch(console.error);
        }
      }

      setNotes(q.notes || '');
      setTermsAndConditions(q.termsAndConditions || '');
      setDiscount(q.discount || 0);
      setQuotationNumber(q.number);
      setRevision(q.revision || 0);
      setTicketNumber(q.ticketNumber || '');
      setSubject(q.subject || '');
      setSubjectAr(q.subjectAr || '');
      
      const diff = Math.ceil((q.dueDate - q.date) / (1000 * 60 * 60 * 24));
      setValidity(diff.toString() === 'NaN' ? '30' : diff.toString());
    } else {
      router.push('/quotations');
    }
  }, [id, quotations, router]);

  useEffect(() => {
    if (date && validity) {
      const d = new Date(date);
      d.setDate(d.getDate() + parseInt(validity));
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date, validity]);

  const filteredInventory = inventory.filter(i => 
    i.description.toLowerCase().includes(searchItem.toLowerCase())
  );

  const addItemToQuote = (inventoryItem: any) => {
    const subtotal = inventoryItem.price;
    const vat = subtotal * 0.15;
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      itemId: inventoryItem.id,
      description: inventoryItem.description,
      unit: inventoryItem.unit,
      quantity: 1,
      price: inventoryItem.price,
      total: subtotal,
      vatAmount: vat,
      totalWithVat: subtotal + vat
    };
    setItems([...items, newItem]);
    setSearchItem('');
    setShowItemResults(false);
  };

  const addManualItem = () => {
    const newItem: QuotationItem = {
      id: crypto.randomUUID(),
      itemId: 'manual',
      description: '',
      unit: 'Nos',
      quantity: 0,
      price: 0,
      total: 0,
      vatAmount: 0,
      totalWithVat: 0
    };
    setItems([...items, newItem]);
  };

  const updateItemRow = (itemId: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        const qty = updated.quantity || 0;
        const price = updated.price || 0;
        updated.total = qty * price;
        updated.vatAmount = updated.total * 0.15;
        updated.totalWithVat = updated.total + updated.vatAmount;
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
  };

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const netAmount = subtotal - discount;
  const totalVat = Math.max(0, netAmount * 0.15);
  const grandTotal = Math.max(0, netAmount + totalVat);

  const handleSave = async () => {
    if (!selectedClientId) return alert('Please select a client');
    if (items.length === 0) return alert('Please add at least one item');
    
    setIsSaving(true);
    try {
      const updatedQuotation: Partial<Quotation> = {
        clientId: selectedClientId,
        date: new Date(date).getTime(),
        dueDate: new Date(dueDate).getTime(),
        items,
        subtotal,
        vatRate: 15,
        vatAmount: totalVat,
        total: netAmount + totalVat,
        discount,
        grandTotal,
        ticketNumber,
        subject,
        subjectAr,
        notes,
        termsAndConditions,
        revision: revision + 1,
        status: 'revised'
      };

      updateQuotation(id as string, updatedQuotation);
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/quotations');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Error saving quotation.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div className="flex items-center gap-4">
          <Link href="/quotations" className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className={styles.title}>Edit Quotation {quotationNumber}</h2>
            <p className={styles.subtitle}>Currently Revision {revision}. Saving will create Revision {revision + 1}.</p>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className="glass-button px-6 py-3 flex items-center gap-2" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={20} />
            {isSaving ? 'Updating...' : 'Save Changes (New Revision)'}
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <User size={20} className="text-blue-400" />
              <h3>Client Information</h3>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Select Client</label>
                <select 
                  className={clsx('glass-input', styles.select)}
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Choose a client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Quotation Date</label>
                <input type="date" className="glass-input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label>Validity</label>
                <select 
                  className="glass-input" 
                  value={validity} 
                  onChange={e => setValidity(e.target.value)}
                >
                  <option value="5">5 Days</option>
                  <option value="10">10 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Ticket Number (Optional)</label>
                <input type="text" className="glass-input" placeholder="e.g. TK-2023..." value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} />
              </div>
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>Subject / Title</label>
                  <input type="text" className="glass-input" placeholder="e.g. Server Maintenance..." value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className="text-right">الموضوع / العنوان</label>
                  <input 
                    type="text" 
                    className="glass-input text-right font-arabic" 
                    placeholder="...صيانة الخوادم" 
                    dir="rtl"
                    value={subjectAr} 
                    onChange={e => setSubjectAr(e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </section>

          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <ShoppingCart size={20} className="text-purple-400" />
              <h3>Line Items</h3>
            </div>

            <div className={styles.itemSearchWrapper}>
              <div className={styles.itemSearch}>
                <Search className={styles.searchIcon} size={18} />
                <input 
                  type="text" 
                  placeholder="Search existing inventory..." 
                  className={styles.searchInput}
                  value={searchItem}
                  onChange={(e) => {
                    setSearchItem(e.target.value);
                    setShowItemResults(true);
                  }}
                  onFocus={() => setShowItemResults(true)}
                />
                {showItemResults && searchItem && (
                  <div className={clsx('glass-panel', styles.searchResults)}>
                    {filteredInventory.map(item => (
                      <div 
                        key={item.id} 
                        className={styles.searchResultItem}
                        onClick={() => addItemToQuote(item)}
                      >
                        <span>{item.description}</span>
                        <span className="text-blue-400 font-normal">{item.price}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className={styles.addCustomBtn} onClick={addManualItem}>
                <Plus size={20} />
                <span>Add Custom Item</span>
              </button>
            </div>

            <div className={styles.tableResponsive}>
              <table className={styles.itemTable}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    <th>VAT (15%)</th>
                    <th>Total (Inc. VAT)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input 
                          type="text" 
                          className={styles.inlineInput} 
                          value={item.description} 
                          onChange={e => updateItemRow(item.id, { description: e.target.value })}
                        />
                      </td>
                      <td>
                        <select 
                          className={styles.inlineSelect}
                          value={item.unit}
                          onChange={e => updateItemRow(item.id, { unit: e.target.value })}
                        >
                          <option value="Nos">Nos</option>
                          <option value="Lot">Lot</option>
                          <option value="LM">LM</option>
                          <option value="Sqm">Sqm</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={clsx(styles.inlineInput, styles.center)} 
                          value={item.quantity || ''} 
                          onChange={e => updateItemRow(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={clsx(styles.inlineInput, styles.right)} 
                          value={item.price || ''} 
                          onChange={e => updateItemRow(item.id, { price: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className={styles.cellStatic}>{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={styles.cellStatic}>{item.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={clsx(styles.cellStatic, "font-medium text-white")}>{item.totalWithVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>
                        <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Terms & Conditions */}
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className="text-blue-400" />
              <h3>Terms & Conditions (Editable)</h3>
            </div>
            <textarea 
              className={clsx('glass-input', styles.notes)} 
              rows={6}
              value={termsAndConditions}
              onChange={e => setTermsAndConditions(e.target.value)}
            />
          </section>

          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className="text-rose-400" />
              <h3>Internal Notes</h3>
            </div>
            <textarea 
              className={clsx('glass-input', styles.notes)} 
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={clsx('glass-panel', styles.summaryCard)}>
            <h3 className={styles.summaryTitle}>Summary</h3>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={clsx(styles.summaryRow, "text-rose-400")}>
              <span>Discount</span>
              <div className="flex items-center gap-2">
                <span></span>
                <input 
                  type="number" 
                  className={styles.discountInput} 
                  value={discount || ''} 
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className={styles.summaryRow}>
              <span>Net Amount</span>
              <span>{netAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Total VAT (15%)</span>
              <span>{totalVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={clsx(styles.summaryRow, styles.totalRow)}>
              <span>Grand Total</span>
              <span>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex flex-col gap-3 mt-8">
              <button 
                className={styles.saveBtnPrimary}
                onClick={handleSave}
                disabled={isSaving || !selectedClientId || items.length === 0}
              >
                <Save size={20} />
                {isSaving ? 'Updating...' : 'Save & Revised'}
              </button>

              {isMounted && selectedClient && items.length > 0 && (
                <PDFDownloadLink 
                  document={<QuotationPDF quotation={{ 
                    id, 
                    number: quotationNumber, 
                    clientId: selectedClientId,
                    date: new Date(date).getTime(),
                    dueDate: new Date(dueDate).getTime(),
                    items,
                    subtotal,
                    vatRate: 15,
                    vatAmount: totalVat,
                    total: netAmount + totalVat,
                    discount,
                    grandTotal,
                    ticketNumber,
                    subject,
                    subjectAr,
                    notes,
                    termsAndConditions,
                    revision: revision + 1,
                    status: 'revised'
                  } as any} client={selectedClient} settings={settings} />} 
                  fileName={`Quotation_${quotationNumber}_R${revision + 1}.pdf`}
                  className={styles.pdfBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (
                    <>
                      <FileDown size={20} />
                      <span>{loading ? 'Generating...' : 'Download Revised PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FileText({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}

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
import styles from './new-quotation.module.css';
import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { QuotationPDF } from '@/components/QuotationPDF';
import { InvoicePDF } from '@/components/InvoicePDF';
import { QuotationItem, Quotation, InventoryItem } from '@/types';
import { Suspense } from 'react';

function BuilderForm() {
  const { clients, inventory, addQuotation, addItem, defaultNotes, updateDefaultNotes, settings } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInvoiceMode = searchParams.get('type') === 'invoice';

  const [selectedClientId, setSelectedClientId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validity, setValidity] = useState('30'); // Default 30 days
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [notes, setNotes] = useState(defaultNotes || '');
  const [ticketNumber, setTicketNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [subjectAr, setSubjectAr] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(`• Validity: 30 days from the date of issue.
• Delivery: As per mutual agreement.
• Payment: 100% Payment as per the agreed terms.
• Quality: Highest quality standards as per requirements.`);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedSubject = localStorage.getItem('last_quotation_subject');
    if (savedSubject) {
      setSubject(savedSubject);
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (subject) {
      localStorage.setItem('last_quotation_subject', subject);
    }
  }, [subject]);

  const [searchItem, setSearchItem] = useState('');
  const [showItemResults, setShowItemResults] = useState(false);

  // Update Due Date when date or validity changes
  useEffect(() => {
    if (date && validity) {
      const d = new Date(date);
      d.setDate(d.getDate() + parseInt(validity));
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [date, validity]);

  // Sync notes with defaultNotes if they change externally
  useEffect(() => {
    if (defaultNotes && !notes) {
      setNotes(defaultNotes);
    }
  }, [defaultNotes]);

  const filteredInventory = inventory.filter(i => 
    i.description.toLowerCase().includes(searchItem.toLowerCase())
  );

  const addItemToQuote = (inventoryItem: InventoryItem) => {
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

  const updateItem = (id: string, updates: Partial<QuotationItem>) => {
    setItems(items.map(item => {
      if (item.id === id) {
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

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const [discount, setDiscount] = useState(0);

  // ... (previous logic)

  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const netAmount = subtotal - discount;
  const totalVat = Math.max(0, netAmount * 0.15);
  const grandTotal = Math.max(0, netAmount + totalVat);

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

  const currentQuotation: Omit<Quotation, 'id' | 'number'> = {
    clientId: selectedClientId,
    date: new Date(date).getTime(),
    dueDate: new Date(dueDate).getTime(),
    items,
    subtotal,
    vatRate: 15,
    vatAmount: totalVat,
    total: netAmount + totalVat, // Matches grandTotal
    discount,
    grandTotal,
    ticketNumber,
    poNumber,
    subject,
    subjectAr,
    notes,
    termsAndConditions,
    revision: 0,
    status: isInvoiceMode ? 'approved' : 'sent',
    salesStatus: isInvoiceMode ? 'PO recieved' : undefined,
    workStatus: isInvoiceMode ? 'Work Done' : 'Work pending'
  };

  const handleSave = async () => {
    if (!selectedClientId) return alert('Please select a client');
    if (items.length === 0) return alert('Please add at least one item');
    
    setIsSaving(true);
    try {
      // Save notes as default for next time
      updateDefaultNotes(notes);

      // Sync items to inventory
      for (const item of items) {
        if (item.description.trim()) {
          const exists = inventory.find(i => i.description.toLowerCase() === item.description.toLowerCase());
          if (!exists) {
            await addItem({
              description: item.description,
              name: item.description,
              unit: item.unit,
              price: item.price
            } as any);
          }
        }
      }

      await addQuotation(currentQuotation);
      router.push(isInvoiceMode ? '/invoices' : '/quotations');
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
          <Link href={isInvoiceMode ? "/invoices" : "/quotations"} className={styles.backBtn}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className={styles.title}>{isInvoiceMode ? 'Create New Invoice' : 'Create New Quotation'}</h2>
            <p className={styles.subtitle}>{isInvoiceMode ? 'Fill in details to generate a direct tax invoice.' : 'Fill in details to generate a professional quotation.'}</p>
          </div>
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          {/* Client Information */}
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
              <div className="col-span-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={styles.formGroup}>
                  <label>PO Number (Optional)</label>
                  <input type="text" className="glass-input" placeholder="e.g. PO-10023..." value={poNumber} onChange={e => setPoNumber(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Ticket Number (Optional)</label>
                  <input type="text" className="glass-input" placeholder="e.g. TK-2023..." value={ticketNumber} onChange={e => setTicketNumber(e.target.value)} />
                </div>
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
            {selectedClient && (
              <div className={styles.clientDetail}>
                <p><strong>Email:</strong> {selectedClient.email} | <strong>Address:</strong> {selectedClient.address}</p>
              </div>
            )}
          </section>

          {/* Line Items */}
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
                        <span className="text-blue-400 font-normal">SAR {item.price}</span>
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
                          onChange={e => updateItem(item.id, { description: e.target.value })}
                          placeholder="Item description..."
                        />
                      </td>
                      <td>
                        <select 
                          className={styles.inlineSelect}
                          value={item.unit}
                          onChange={e => updateItem(item.id, { unit: e.target.value })}
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
                          onChange={e => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          placeholder=""
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className={clsx(styles.inlineInput, styles.right)} 
                          value={item.price || ''} 
                          onChange={e => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })}
                          placeholder=""
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
            
            {items.length === 0 && (
              <div className={styles.emptyItems}>Enter items above to build your quotation. New items will be automatically saved to inventory.</div>
            )}
          </section>

          {/* Terms & Conditions */}
          {!isInvoiceMode && (
            <section className={clsx('glass-panel', styles.section)}>
              <div className={styles.sectionHeader}>
                <FileText size={20} className="text-blue-400" />
                <h3>Terms & Conditions (Editable)</h3>
              </div>
              <textarea 
                className={clsx('glass-input', styles.notes)} 
                placeholder="Add formal terms and conditions..."
                rows={6}
                value={termsAndConditions}
                onChange={e => setTermsAndConditions(e.target.value)}
              />
            </section>
          )}

          {/* Notes */}
          <section className={clsx('glass-panel', styles.section)}>
            <div className={styles.sectionHeader}>
              <FileText size={20} className="text-rose-400" />
              <h3>Internal Notes</h3>
            </div>
            <textarea 
              className={clsx('glass-input', styles.notes)} 
              placeholder="Add payment terms, validity, and delivery details..."
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </section>
        </div>

        <div className={styles.rightCol}>
          <section className={clsx('glass-panel', styles.summaryCard)}>
            <h3 className={styles.summaryTitle}>Grand Summary</h3>
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
                  placeholder="0.00"
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
                {isSaving ? 'Processing...' : 'Finalize & Save'}
              </button>

              {isMounted && selectedClient && items.length > 0 && (
                <PDFDownloadLink 
                  document={isInvoiceMode ? 
                    <InvoicePDF quotation={{ ...currentQuotation, id: 'preview', number: 'PREVIEW' }} client={selectedClient} settings={settings} /> :
                    <QuotationPDF quotation={{ ...currentQuotation, id: 'preview', number: 'PREVIEW' }} client={selectedClient} settings={settings} />
                  } 
                  fileName={isInvoiceMode ? `Invoice_Preview.pdf` : `Quotation_Preview.pdf`}
                  className={styles.pdfBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {/* @ts-ignore */}
                  {({ loading }) => (
                    <>
                      <FileDown size={20} />
                      <span>{loading ? 'Generating...' : 'Download Preview PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              )}
            </div>

            <div className={styles.currencyNotice}>
              All calculations include 15% VAT per line item.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function NewQuotation() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading builder...</div>}>
      <BuilderForm />
    </Suspense>
  );
}

// Simple Helper for layout
function FileText({ size, className }: { size: number; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>;
}

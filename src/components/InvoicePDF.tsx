import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path, Circle } from '@react-pdf/renderer';
import { Quotation, Client, CompanySettings } from '../types';

// Register Arabic Font
Font.register({
  family: 'ArabicFont',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-Bold.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 100,
    fontSize: 10.5,
    color: '#1e293b',
    backgroundColor: '#fff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: 2,
    borderBottomColor: '#10b981',
  },
  headerLeft: {
    width: '65%',
  },
  logoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  logoContainer: {
    width: 42,
    height: 42,
  },
  logo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#60a5fa',
  },
  companyAr: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'ArabicFont',
  },
  companyAddress: {
    fontSize: 8.5,
    color: '#64748b',
    lineHeight: 1.3,
    fontFamily: 'ArabicFont',
  },
  titleContainer: {
    alignItems: 'flex-end',
  },
  titleEn: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  titleAr: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: -4,
    fontFamily: 'ArabicFont',
  },
  mainGrid: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  infoBox: {
    flex: 1,
    padding: '6 10',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 6,
    fontFamily: 'ArabicFont',
  },
  infoValue: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  invoiceMeta: {
    width: 210,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 3,
  },
  metaLabel: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  subjectSection: {
    marginBottom: 8,
    padding: '8 12',
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderLeft: 3,
    borderLeftColor: '#475569',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    fontFamily: 'ArabicFont',
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#60a5fa',
    padding: '2 4',
    borderRadius: 3,
    marginBottom: 1,
  },
  headerText: {
    color: '#fff',
    fontSize: 9.5,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '2 4',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  colDesc: { width: '30%' },
  colUnit: { width: '8%', textAlign: 'center', fontSize: 9.5, color: '#1e293b' },
  colQty: { width: '7%', textAlign: 'center', fontSize: 9.5, color: '#1e293b' },
  colPrice: { width: '12%', textAlign: 'center', fontSize: 9.5, color: '#1e293b' },
  colExVat: { width: '14%', textAlign: 'right', fontSize: 9.5, color: '#1e293b' },
  colVat: { width: '13%', textAlign: 'right', fontSize: 9.5, color: '#1e293b' },
  colTotal: { width: '16%', textAlign: 'right', fontSize: 9.5, color: '#1e293b' },
  
  descEn: { fontSize: 9.5, fontWeight: 'bold', color: '#1e293b' },
  descAr: { fontSize: 9.5, color: '#64748b', marginTop: 0, fontFamily: 'ArabicFont' },

  summarySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  qrSection: {
    width: '50%',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    border: 1,
    borderColor: '#f1f5f9',
  },
  qrCode: {
    width: 85, // Made bigger
    height: 85, // Made bigger
  },
  summaryBlock: {
    width: '45%',
    border: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
   summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    fontSize: 9.5,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#10b981',
    padding: '8 8',
  },
  totalLabelBox: {
    flex: 1,
  },
  totalValueBox: {
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    borderTop: 2,
    borderTopColor: '#10b981',
    paddingTop: 10,
  },
  bankLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    fontSize: 9.5,
    color: '#1e293b',
    fontWeight: 'bold',
    fontFamily: 'ArabicFont',
    backgroundColor: '#f0fdf4',
    padding: '6 12',
    borderRadius: 4,
    border: 1,
    borderColor: '#dcfce7',
  },
  contactBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '8 25',
    borderRadius: 6,
    border: 1,
    borderColor: '#f1f5f9',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 9.5,
    color: '#334155',
    fontWeight: 'bold',
    letterSpacing: 0.2,
    fontFamily: 'ArabicFont',
  },
  iconSvg: {
    width: 12,
    height: 12,
  }
});

// Icons
const BankIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 1L3 5v2h18V5l-9-4zm-7 8v10h2V9H5zm4 0v10h2V9H9zm4 0v10h2V9h-2zm4 0v10h2V9h-2zM2 21v2h20v-2H2z" fill="#059669" />
  </Svg>
);

const WebIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#059669" />
  </Svg>
);

const EmailIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#059669" />
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8c-1.48 0-2.85-.41-4.02-1.11l-.29-.17-3 .78.79-2.91-.18-.3C4.59 14.93 4 13.54 4 12c0-4.41 3.59-8 8-8z" fill="#059669" />
  </Svg>
);

interface Props {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
  qrDataUrl?: string | null;
}

export const InvoicePDF = ({ quotation, client, settings, qrDataUrl }: Props) => {
  if (!quotation || !client || !settings) {
    return (
      <Document title="Loading...">
        <Page size="A4" style={styles.page}>
          <View><Text>Loading document data...</Text></View>
        </Page>
      </Document>
    );
  }
  const qDate = quotation.invoiceDate ? new Date(quotation.invoiceDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  const vDate = quotation.supplyDate ? new Date(quotation.supplyDate).toLocaleDateString('en-GB') : qDate;

  // Extract invoice number: prefer top-level, fallback to metadata item in items
  const metadata: any = (quotation.items || []).find((it: any) => it._isWorkflowMetadata) || {};
  const effectiveInvoiceNumber = quotation.invoiceNumber || metadata.invoiceNumber;
  
  const isZatcaDone = !!effectiveInvoiceNumber;
  const invoiceNumber = isZatcaDone
    ? effectiveInvoiceNumber                 // Official: INV-YYYY-XXXX
    : 'DRAFT';                                 // Before ZATCA

  return (
    <Document title={isZatcaDone ? `Invoice - ${invoiceNumber}` : `Draft Invoice - ${quotation.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ 
              backgroundColor: '#fff',
              padding: '6 10',
              borderRadius: 4,
              border: 1,
              borderColor: '#e2e8f0',
            }}>
              <View style={[styles.logoRow, { marginBottom: 4 }]}>
                {!!settings.logo && (
                  <View style={styles.logoContainer}>
                    <Image src={settings.logo} style={styles.logo} />
                  </View>
                )}
                <View>
                  <Text style={styles.companyName}>{`${settings.name || 'Marina WorldLink Co.'}`}</Text>
                  <Text style={[styles.companyAr, { fontFamily: 'ArabicFont' }]}>{`${settings.nameAr || 'شركة مارينا وورلدلينك'}`}</Text>
                </View>
              </View>
              <View style={styles.companyAddress}>
                {settings.splitAddress ? (
                  <View style={{ gap: 1 }}>
                    <Text>{`${settings.splitAddress.buildingNumber || ' '} ${settings.splitAddress.streetName || ' '}`}</Text>
                    <Text>{`${settings.splitAddress.district || ' '}, ${settings.splitAddress.city || ' '} ${settings.splitAddress.postalCode || ' '}`}</Text>
                    <Text>{settings.splitAddress.countryCode === 'SA' ? 'Kingdom of Saudi Arabia' : `${settings.splitAddress.countryCode || ' '}`}</Text>
                  </View>
                ) : (
                  <View style={{ gap: 1 }}>
                    <Text>{`${settings.address || ' '}`}</Text>
                  </View>
                )}
                <View style={{ marginTop: 2, flexDirection: 'row', gap: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{`VAT: ${settings.vatNumber || ' '}`}</Text>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>{`CR: ${settings.crNumber || ' '}`}</Text>
                </View>
                <Text style={{ marginTop: 1 }}>{`Mob: ${settings.contact || ' '}`}</Text>
              </View>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.titleEn}>Tax Invoice</Text>
            <Text style={[styles.titleAr, { fontFamily: 'ArabicFont' }]}>فاتورة ضريبية</Text>
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
              <Text style={{ fontSize: 7, color: '#10b981', fontWeight: 'bold' }}>ZATCA Compliant /</Text>
              <Text style={{ fontSize: 7, color: '#10b981', fontWeight: 'bold', fontFamily: 'ArabicFont' }}>متوافق مع الزكاة</Text>
            </View>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.mainGrid}>
          <View style={styles.infoBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Text style={[styles.infoValue, { fontWeight: 'bold', fontSize: 11, marginBottom: 0 }]}>{`${client?.name || ' '}`}</Text>
              <View style={[styles.infoLabel, { marginBottom: 0 }]}>
                <Text>Bill To</Text>
                <Text style={{ fontFamily: 'ArabicFont' }}>فاتورة إلى</Text>
              </View>
            </View>
            <View style={styles.companyAddress}>
              <View style={{ gap: 1 }}>
                {client?.splitAddress ? (
                  <>
                    <Text>{`${client.splitAddress.buildingNumber || ' '} ${client.splitAddress.streetName || ' '}`}</Text>
                    <Text>{`${client.splitAddress.district || ' '}, ${client.splitAddress.city || ' '} ${client.splitAddress.postalCode || ' '}`}</Text>
                    <Text>{client.splitAddress.countryCode === 'SA' ? 'Kingdom of Saudi Arabia' : `${client.splitAddress.countryCode || ' '}`}</Text>
                  </>
                ) : (
                  <Text>{`${client?.address || 'Address Not Provided'}`}</Text>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {!!client?.vatNumber && (
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>
                      {`VAT: ${client.vatNumber || ' '}`}
                    </Text>
                  )}
                  {!!client?.otherId && (
                    <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>
                      {`CR: ${client.otherId || ' '}`}
                    </Text>
                  )}
                </View>
                {!!client?.phone && (
                  <Text>{`Mob: ${client.phone || ' '}`}</Text>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.invoiceMeta}>
            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={styles.metaLabel}>{String('Invoice No /')}</Text>
                <Text style={[styles.metaLabel, { fontFamily: 'ArabicFont' }]}>{String('رقم الفاتورة')}</Text>
              </View>
              <Text style={[
                styles.metaValue,
                { fontWeight: 'bold' },
                !isZatcaDone ? { color: '#f59e0b' } : {}   // amber for DRAFT
              ] as any}>{String(invoiceNumber)}</Text>
            </View>
            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={styles.metaLabel}>Date /</Text>
                <Text style={[styles.metaLabel, { fontFamily: 'ArabicFont' }]}>{String('التاريخ')}</Text>
              </View>
              <Text style={styles.metaValue}>{String(qDate || ' ')}</Text>
            </View>
            {!!quotation.poNumber && (
              <View style={styles.metaRow}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text style={styles.metaLabel}>{String('PO No /')}</Text>
                  <Text style={[styles.metaLabel, { fontFamily: 'ArabicFont' }]}>{String('رقم التعميد')}</Text>
                </View>
                <Text style={styles.metaValue}>{String(quotation.poNumber || ' ')}</Text>
              </View>
            )}
            {!!quotation.ticketNumber && (
              <View style={styles.metaRow}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <Text style={styles.metaLabel}>{String('Ticket No /')}</Text>
                  <Text style={[styles.metaLabel, { fontFamily: 'ArabicFont' }]}>{String('رقم التذكرة')}</Text>
                </View>
                <Text style={[styles.metaValue, { fontWeight: 'bold' }]}>{String(quotation.ticketNumber || ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subject */}
        {!!quotation.subject && (
          <View style={styles.subjectSection}>
            <Text style={styles.subjectText}>{`Subject: ${quotation.subject || ' '}`}</Text>
            {!!quotation.subjectAr && (
              <Text style={[styles.subjectText, { fontFamily: 'ArabicFont' }]}>{`الموضوع: ${quotation.subjectAr || ' '}`}</Text>
            )}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.headerText}>{String('Description')}</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>{String('بيان الأعمال')}</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={styles.headerText}>Unit</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>الوحدة</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>Qty</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>الكمية</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.headerText}>Rate</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>سعر الوحدة</Text>
            </View>
            <View style={styles.colExVat}>
              <Text style={styles.headerText}>Total (Ex. VAT)</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>المبلغ</Text>
            </View>
            <View style={styles.colVat}>
              <Text style={styles.headerText}>{String('VAT')}</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>{String('ضريبة (15%)')}</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.headerText}>{String('Total (Inc. VAT)')}</Text>
              <Text style={[styles.headerText, { fontFamily: 'ArabicFont' }]}>{String('الإجمالي الكلي')}</Text>
            </View>
          </View>

          {(quotation.items || []).filter((item: any) => item && typeof item === 'object' && !item._isWorkflowMetadata).map((item, i) => (
            <View key={item.id || i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#fcfdfd' }]}>
              <View style={styles.colDesc}>
                <Text style={(`${item.description || ' '}`).includes('\n') ? styles.descEn : [styles.descEn, { marginBottom: 2 }]}>{`${item.description || ' '}`}</Text>
                <Text style={styles.descAr}>{`${item.descriptionAr || 'وصف المنتج بالعربية'}`}</Text>
              </View>
              <Text style={styles.colUnit}>{`${item.unit || ' '}`}</Text>
              <Text style={styles.colQty}>{`${item.quantity || 0}`}</Text>
              <Text style={styles.colPrice}>{(Number(item.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.colExVat}>{(Number(item.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.colVat}>{(Number(item.vatAmount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{(Number(item.totalWithVat) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection} wrap={false}>
          <View style={styles.qrSection}>
            {!!qrDataUrl && <Image src={qrDataUrl} style={styles.qrCode} />}
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#10b981' }}>E-Invoice Verification</Text>
              <Text style={{ fontSize: 7, color: '#94a3b8', width: 130 }}>This invoice is digitally signed and compliant with ZATCA regulations.</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Text style={{ fontSize: 6, color: '#10b981', fontWeight: 'bold' }}>Scan to verify /</Text>
                <Text style={{ fontSize: 6, color: '#10b981', fontWeight: 'bold', fontFamily: 'ArabicFont' }}>امسح للتحقق</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryBlock}>
            <View style={[styles.summaryRow, { alignItems: 'center' }]}>
              <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: 'bold', fontFamily: 'ArabicFont', flex: 1 }}>{'Subtotal / المجموع الفرعي'}</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{String((quotation.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</Text>
            </View>
            <View style={[styles.summaryRow, { alignItems: 'center' }]}>
              <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: 'bold', fontFamily: 'ArabicFont', flex: 1 }}>{'VAT (15%) / الضريبة'}</Text>
              <Text style={{ fontSize: 9, fontWeight: 'bold' }}>{String((quotation.vatAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}</Text>
            </View>
            <View style={[styles.grandTotal, { alignItems: 'center' }]}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold', fontFamily: 'ArabicFont', flex: 1 }}>{'Total Amount / المجموع الكلي'}</Text>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{`SAR ${String((quotation.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))}`}</Text>
            </View>
          </View>
        </View>

        {/* Note about Digital Signature instead of Stamp Section */}
        <View style={{ marginTop: 4, padding: 6, borderTop: 1, borderTopColor: '#f1f5f9' }}>
           <Text style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>
             Electronically Generated Invoice - No Signature or Stamp Required
           </Text>
            <Text style={{ fontSize: 7, color: '#94a3b8', textAlign: 'center', marginTop: 2, fontFamily: 'ArabicFont' }}>
              فاتورة صادرة إلكترونياً - لا تتطلب توقيعاً أو ختماً
            </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.bankLine}>
            <BankIcon />
            <Text>{String('Al Rajhi Bank (مصرف الراجحي)')}</Text>
            <Text>|</Text>
            <Text>Acc: 525000010006080456305</Text>
            <Text>|</Text>
            <Text>IBAN: SA58 8000 0525 6080 1045 6305</Text>
          </View>
          
          <View style={styles.contactBar}>
            <View style={styles.contactItem}>
              <WebIcon />
              <Text style={styles.contactText}>www.marinasafetygroup.com</Text>
            </View>
            <View style={styles.contactItem}>
              <EmailIcon />
              <Text style={styles.contactText}>info@marinasafetygroup.com</Text>
            </View>
            <View style={styles.contactItem}>
              <WhatsAppIcon />
              <Text style={styles.contactText}>+966 530836711</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

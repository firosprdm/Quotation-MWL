import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Quotation, Client, CompanySettings } from '../types';

// Register Arabic Font
Font.register({
  family: 'ArabicFont',
  fonts: [
    { src: 'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Regular.ttf' },
    { src: 'https://raw.githubusercontent.com/rastikerdar/vazirmatn/master/fonts/ttf/Vazirmatn-Bold.ttf', fontWeight: 'bold' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    color: '#333',
    backgroundColor: '#fff',
    fontFamily: 'ArabicFont',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 20,
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'right',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  infoBlock: {
    width: '45%',
  },
  infoTitle: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 40,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  colDesc: { width: '28%' },
  colUnit: { width: '10%', textAlign: 'center' },
  colQty: { width: '7%', textAlign: 'center' },
  colPrice: { width: '13%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },
  colVat: { width: '12%', textAlign: 'right' },
  colTotalInc: { width: '17%', textAlign: 'right' },
  
  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryBlock: {
    width: '40%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    color: '#64748b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTop: 2,
    borderTopColor: '#3b82f6',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
    color: '#94a3b8',
    fontSize: 8,
  }
});

interface Props {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
}

export const QuotationPDF = ({ quotation, client, settings }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          {settings.logo ? (
            <Image src={settings.logo} style={{ width: 120, height: 40, objectFit: 'contain' }} />
          ) : (
            <Text style={[styles.companyName, { color: '#3b82f6' }]}>{settings.name}</Text>
          )}
          <Text>{settings.address || ''}</Text>
          <Text>VAT No / الرقم الضريبي: {settings.vatNumber || ''}</Text>
          <Text>CR No / رقم السجل التجاري: {settings.crNumber || '1010000000'}</Text>
          <Text>Contact / الاتصال: {settings.contact || ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.title, { color: '#3b82f6' }]}>Quotation</Text>
          <Text style={[styles.title, { fontSize: 20, marginTop: -5 }]}>عرض سعر</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={[styles.infoBlock, { borderLeft: 2, borderLeftColor: '#3b82f6', paddingLeft: 10 }]}>
          <Text style={styles.infoTitle}>Bill To / فاتورة إلى</Text>
          <Text style={[styles.infoText, { fontWeight: 'bold', fontSize: 11 }]}>{client.name}</Text>
          <View style={{ marginTop: 4 }}>
            {client.splitAddress ? (
              <View>
                <Text style={styles.infoText}>{`${client.splitAddress.buildingNumber || ''} ${client.splitAddress.streetName || ''}`}</Text>
                <Text style={styles.infoText}>{`${client.splitAddress.district || ''}, ${client.splitAddress.city || ''}`}</Text>
                <Text style={styles.infoText}>{`${client.splitAddress.postalCode || ''}, ${client.splitAddress.countryCode || ''}`}</Text>
              </View>
            ) : (
              <Text style={styles.infoText}>{client.address || ''}</Text>
            )}
          </View>
          {client.vatNumber && <Text style={styles.infoText}>VAT No / الرقم الضريبي: {client.vatNumber}</Text>}
          {client.otherId && <Text style={styles.infoText}>CR No / رقم السجل التجاري: {client.otherId}</Text>}
          {client.phone && <Text style={styles.infoText}>Contact / الاتصال: {client.phone}</Text>}
          <Text style={styles.infoText}>{client.email}</Text>
        </View>
        <View style={styles.infoBlock}>
          <View style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.infoTitle}>Quotation No / رقم العرض</Text>
            <Text style={styles.infoText}>
              {quotation.number}{quotation.revision > 0 ? `-R${quotation.revision}` : ''}
            </Text>
          </View>
          <View style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.infoTitle}>Date / التاريخ</Text>
            <Text style={styles.infoText}>{new Date(quotation.date).toLocaleDateString('en-GB')}</Text>
          </View>
          <View style={{ marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.infoTitle}>Valid Until / صالح لغاية</Text>
            <Text style={styles.infoText}>{new Date(quotation.dueDate).toLocaleDateString('en-GB')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableHeader, { backgroundColor: '#3b82f6' }]}>
          <View style={[styles.colDesc, { color: '#fff' }]}>
            <Text>Description</Text>
            <Text style={{ fontSize: 7 }}>الوصف</Text>
          </View>
          <View style={[styles.colUnit, { color: '#fff' }]}>
            <Text>Unit</Text>
            <Text style={{ fontSize: 7 }}>الوحدة</Text>
          </View>
          <View style={[styles.colQty, { color: '#fff' }]}>
            <Text>Qty</Text>
            <Text style={{ fontSize: 7 }}>الكمية</Text>
          </View>
          <View style={[styles.colPrice, { color: '#fff' }]}>
            <Text>Price</Text>
            <Text style={{ fontSize: 7 }}>السعر</Text>
          </View>
          <View style={[styles.colVat, { color: '#fff' }]}>
            <Text>VAT</Text>
            <Text style={{ fontSize: 7 }}>الضريبة</Text>
          </View>
          <View style={[styles.colTotalInc, { color: '#fff' }]}>
            <Text>Total (Inc. VAT)</Text>
            <Text style={{ fontSize: 7 }}>الإجمالي شامل الضريبة</Text>
          </View>
        </View>
        {quotation.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colUnit}>{item.unit}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colPrice}>{(item.price || 0).toFixed(2)}</Text>
            <Text style={styles.colTotal}>{(item.total || 0).toFixed(2)}</Text>
            <Text style={styles.colVat}>{(item.vatAmount || 0).toFixed(2)}</Text>
            <Text style={styles.colTotalInc}>{(item.totalWithVat || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.summarySection}>
        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <View>
              <Text>Subtotal</Text>
              <Text style={{ fontSize: 7 }}>المجموع الفرعي</Text>
            </View>
            <Text>SAR {(quotation.subtotal || 0).toFixed(2)}</Text>
          </View>
          {(quotation.discount || 0) > 0 && (
            <View style={styles.summaryRow}>
              <View>
                <Text>Discount</Text>
                <Text style={{ fontSize: 7 }}>الخصم</Text>
              </View>
              <Text>- SAR {(quotation.discount || 0).toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <View>
              <Text>VAT (15%)</Text>
              <Text style={{ fontSize: 7 }}>ضريبة القيمة المضافة</Text>
            </View>
            <Text>SAR {(quotation.vatAmount || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, { backgroundColor: '#f8fafc', paddingHorizontal: 8, borderRadius: 4 }]}>
            <View>
              <Text style={[styles.totalLabel, { color: '#3b82f6' }]}>Grand Total</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>المجموع الكلي</Text>
            </View>
            <Text style={styles.totalText}>SAR {(quotation.grandTotal || 0).toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {quotation.notes && (
        <View style={{ marginTop: 40 }}>
          <Text style={styles.infoTitle}>Notes</Text>
          <Text style={styles.infoText}>{quotation.notes}</Text>
        </View>
      )}

      <Text style={styles.footer}>
        Thank you for your business. This is a computer generated quotation and does not require a signature.
      </Text>
    </Page>
  </Document>
);

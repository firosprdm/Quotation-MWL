import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path, Circle } from '@react-pdf/renderer';
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
    padding: 30,
    paddingBottom: 100,
    fontSize: 10.5,
    color: '#1e293b',
    backgroundColor: '#fff',
    fontFamily: 'ArabicFont',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: 2,
    borderBottomColor: '#60a5fa',
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
  },
  companyAddress: {
    fontSize: 8.5,
    color: '#64748b',
    lineHeight: 1.3,
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
  },
  mainGrid: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 12,
  },
  infoBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoValue: {
    fontSize: 11,
    color: '#1e293b',
    lineHeight: 1.2,
  },
  invoiceMeta: {
    width: 180,
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
    fontSize: 9,
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
    padding: '8 10',
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    borderLeft: 3,
    borderLeftColor: '#60a5fa',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  introText: {
    fontSize: 9.5,
    color: '#475569',
    lineHeight: 1.4,
    marginBottom: 12,
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#60a5fa',
    padding: '8 4',
    borderRadius: 3,
    marginBottom: 2,
  },
  headerText: {
    color: '#fff',
    fontSize: 8.5,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    padding: '10 4',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  colDesc: { width: '30%' },
  colUnit: { width: '8%', textAlign: 'center' },
  colQty: { width: '7%', textAlign: 'center' },
  colPrice: { width: '12%', textAlign: 'center' },
  colExVat: { width: '14%', textAlign: 'right' },
  colVat: { width: '13%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right' },
  
  descEn: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  descAr: { fontSize: 9, color: '#64748b', marginTop: 2 },

  summarySection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 5,
  },
  summaryBlock: {
    width: '35%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#60a5fa',
    padding: '8 8',
    borderRadius: 4,
    marginTop: 6,
  },
  totalLabelBox: {
    flex: 1,
  },
  totalValueBox: {
    textAlign: 'right',
  },
  termsSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: 1,
    borderColor: '#e2e8f0',
  },
  termTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 2,
  },
  termText: {
    fontSize: 9.5,
    color: '#475569',
    lineHeight: 1.5,
  },
  stampSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 10,
  },
  stampBox: {
    width: '45%',
    height: 65,
    border: 1,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
    backgroundColor: '#fcfdfd',
  },
  stampLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    borderTop: 2,
    borderTopColor: '#60a5fa',
    paddingTop: 10,
  },
  bankLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6, // Gap of approx 2mm (1mm is ~2.8pt)
    fontSize: 9,
    color: '#1e293b',
    fontWeight: 'bold',
    backgroundColor: '#f0f9ff',
    padding: '6 12',
    borderRadius: 4,
    border: 1,
    borderColor: '#e0f2fe',
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
    fontSize: 9, // Slightly bigger, more premium font feel
    color: '#334155',
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  iconSvg: {
    width: 12,
    height: 12,
  }
});

// Premium Minimalist Icons
const BankIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 1L3 5v2h18V5l-9-4zm-7 8v10h2V9H5zm4 0v10h2V9H9zm4 0v10h2V9h-2zm4 0v10h2V9h-2zM2 21v2h20v-2H2z" fill="#3b82f6" />
  </Svg>
);

const WebIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#3b82f6" />
  </Svg>
);

const EmailIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#3b82f6" />
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8c-1.48 0-2.85-.41-4.02-1.11l-.29-.17-3 .78.79-2.91-.18-.3C4.59 14.93 4 13.54 4 12c0-4.41 3.59-8 8-8z" fill="#3b82f6" />
  </Svg>
);

interface Props {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
}

export const QuotationPDF = ({ quotation, client, settings }: Props) => {
  const qDate = new Date(quotation.date).toLocaleDateString('en-GB');
  const vDate = new Date(quotation.dueDate).toLocaleDateString('en-GB');
  const refNo = `${quotation.number}${quotation.revision > 0 ? `-R${quotation.revision}` : ''}`;

  return (
    <Document title={`Quotation - ${refNo}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoRow}>
              {settings.logo && (
                <View style={styles.logoContainer}>
                  <Image src={settings.logo} style={styles.logo} />
                </View>
              )}
              <View>
                <Text style={styles.companyName}>Marina WorldLink Co.</Text>
                <Text style={styles.companyAr}>شركة مارينا وورلدلينك</Text>
              </View>
            </View>
            <View style={styles.companyAddress}>
              <Text>1234 King Fahd Road, Al Olaya, Riyadh, SA</Text>
              <Text style={{ fontWeight: 'bold', color: '#1e293b' }}>
                VAT: 300000000000003 | CR: 1010000000
              </Text>
              <Text>Mob: +966 507465418</Text>
            </View>
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.titleEn}>Quotation</Text>
            <Text style={styles.titleAr}>عرض سعر</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.mainGrid}>
          <View style={styles.infoBox}>
            <View style={styles.infoLabel}>
              <Text>Quotation To</Text>
              <Text>عرض إلى</Text>
            </View>
            <Text style={[styles.infoValue, { fontWeight: 'bold', fontSize: 11 }]}>{client.name}</Text>
            <View style={{ marginTop: 2 }}>
              {client.splitAddress ? (
                <Text style={styles.companyAddress}>{`${client.splitAddress.buildingNumber} ${client.splitAddress.streetName}, ${client.splitAddress.district}, ${client.splitAddress.city}`}</Text>
              ) : (
                <Text style={styles.companyAddress}>{client.address}</Text>
              )}
            </View>
          </View>
          
          <View style={styles.invoiceMeta}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Ref No / رقم المرجع</Text>
              <Text style={styles.metaValue}>{refNo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Date / التاريخ</Text>
              <Text style={styles.metaValue}>{qDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Valid Until / صالح لغاية</Text>
              <Text style={styles.metaValue}>{vDate}</Text>
            </View>
          </View>
        </View>

        {/* Subject & Intro */}
        <View style={styles.subjectSection}>
          <Text style={styles.subjectText}>Subject: Project Proposal</Text>
          <Text style={[styles.subjectText, { fontSize: 11 }]}>الموضوع: عرض مشروع</Text>
        </View>

        <Text style={styles.introText}>
          We are pleased to submit our competitive proposal for the services/products listed below. 
          Our team is committed to providing the highest quality standards in line with your requirements.
        </Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colDesc}>
              <Text style={styles.headerText}>Description</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الوصف</Text>
            </View>
            <View style={styles.colUnit}>
              <Text style={styles.headerText}>Unit</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الوحدة</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>Qty</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الكمية</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.headerText}>Rate</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>السعر</Text>
            </View>
            <View style={styles.colExVat}>
              <Text style={styles.headerText}>Total (Ex. VAT)</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>بدون ضريبة</Text>
            </View>
            <View style={styles.colVat}>
              <Text style={styles.headerText}>VAT</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الضريبة</Text>
            </View>
            <View style={styles.colTotal}>
              <Text style={styles.headerText}>Total (Inc. VAT)</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الإجمالي</Text>
            </View>
          </View>

          {quotation.items.map((item, i) => (
            <View key={item.id} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#fcfdfd' }]}>
              <View style={styles.colDesc}>
                <Text style={styles.descEn}>{item.description}</Text>
                <Text style={styles.descAr}>وصف المنتج بالعربية</Text>
              </View>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{item.price.toFixed(2)}</Text>
              <Text style={styles.colExVat}>{item.total.toFixed(2)}</Text>
              <Text style={styles.colVat}>{item.vatAmount.toFixed(2)}</Text>
              <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{item.totalWithVat.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#94a3b8' }}>Subtotal / المجموع الفرعي</Text>
              <Text>SAR {quotation.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#94a3b8' }}>VAT (15%) / الضريبة</Text>
              <Text>SAR {quotation.vatAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotal}>
              <View style={styles.totalLabelBox}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Total Amount</Text>
                <Text style={{ color: '#fff', fontSize: 8 }}>المجموع الكلي</Text>
              </View>
              <View style={styles.totalValueBox}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>SAR {quotation.grandTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsSection}>
          <Text style={styles.termTitle}>TERMS & CONDITIONS</Text>
          <Text style={styles.termText}>
            {quotation.termsAndConditions || 
              `• Validity: 30 days from the date of issue.
• Delivery: As per mutual agreement.
• Payment: 100% Payment as per the agreed terms.
• Quality: Highest quality standards as per requirements.`}
          </Text>
        </View>

        {/* Stamp Section */}
        <View style={styles.stampSection}>
          <View style={styles.stampBox}>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#1e293b', position: 'absolute', top: 6 }}>For MARINA WorldLink</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.stampLabel}>Authorized Signatory & Stamp</Text>
              <Text style={[styles.stampLabel, { fontSize: 7, marginTop: 1 }]}>توقيع وختم المورد</Text>
            </View>
          </View>
          <View style={styles.stampBox}>
            <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#1e293b', position: 'absolute', top: 6 }}>Customer Acceptance</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.stampLabel}>Signature & Stamp</Text>
              <Text style={[styles.stampLabel, { fontSize: 7, marginTop: 1 }]}>توقيع وختم العميل</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <View style={styles.bankLine}>
            <BankIcon />
            <Text>Al Rajhi Bank (مصرف الراجحي)</Text>
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

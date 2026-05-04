import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from '@react-pdf/renderer';
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
    borderBottomColor: '#60a5fa', // Blue like Quotation
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
    marginRight: 8.5, // Move left by 3mm (1mm ~ 2.83pt)
  },
  titleEn: {
    fontSize: 16, // Same as Company Name
    fontWeight: 'bold',
    color: '#1e293b',
    textTransform: 'uppercase',
  },
  titleAr: {
    fontSize: 14, // Proportional to companyAr
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
    width: 200,
    gap: 4,
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
    fontSize: 9.5,
    color: '#1e293b',
    fontWeight: 'bold',
  },
  subjectSection: {
    marginBottom: 8,
    padding: '8 10',
    backgroundColor: '#f0f9ff', // Blue-ish
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
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 15,
  },
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#60a5fa', // Blue
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
    padding: '8 4',
    borderBottom: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
  },
  colNo: { width: '8%', textAlign: 'center' },
  colDesc: { width: '77%' },
  colQty: { width: '15%', textAlign: 'center' },
  
  descEn: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  descAr: { fontSize: 9, color: '#64748b', marginTop: 2 },

  stampSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  stampBox: {
    width: '45%',
    height: 80,
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
    borderTopColor: '#60a5fa', // Blue
    paddingTop: 10,
  },
  bankLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
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
    fontSize: 9,
    color: '#334155',
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  iconSvg: {
    width: 12,
    height: 12,
  }
});

// Icons (Same as Quotation)
const BankIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 1L3 5v2h18V5l-9-4zm-7 8v10h2V9H5zm4 0v10h2V9H9zm4 0v10h2V9h-2zm4 0v10h2V9h-2zM2 21v2h20v-2H2z" fill="#60a5fa" />
  </Svg>
);

const WebIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="#60a5fa" />
  </Svg>
);

const EmailIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6zm-2 0l-8 5-8-5h16zm0 12H4V8l8 5 8-5v10z" fill="#60a5fa" />
  </Svg>
);

const WhatsAppIcon = () => (
  <Svg viewBox="0 0 24 24" style={styles.iconSvg}>
    <Path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12 4c4.41 0 8 3.59 8 8s-3.59 8-8 8c-1.48 0-2.85-.41-4.02-1.11l-.29-.17-3 .78.79-2.91-.18-.3C4.59 14.93 4 13.54 4 12c0-4.41 3.59-8 8-8z" fill="#60a5fa" />
  </Svg>
);

interface Props {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
}

export const CertificatePDF = ({ quotation, client, settings }: Props) => {
  const qDate = new Date(quotation.date).toLocaleDateString('en-GB');
  const refNo = `${quotation.number}${quotation.revision > 0 ? `-R${quotation.revision}` : ''}`;

  return (
    <Document title={`Completion Certificate - ${refNo}`}>
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
            <Text style={styles.titleEn}>Completion Certificate</Text>
            <Text style={styles.titleAr}>شهادة إنجاز عمل</Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.mainGrid}>
          <View style={styles.infoBox}>
            <View style={styles.infoLabel}>
              <Text>Customer / العميل</Text>
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
              <Text style={styles.metaLabel}>Quotation Ref / مرجع العرض</Text>
              <Text style={styles.metaValue}>{refNo}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Certificate Date / التاريخ</Text>
              <Text style={styles.metaValue}>{new Date().toLocaleDateString('en-GB')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>PO Number / رقم أمر الشراء</Text>
              <Text style={styles.metaValue}>{quotation.poNumber || '---'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Ticket No / رقم التذكرة</Text>
              <Text style={styles.metaValue}>{quotation.ticketNumber || '---'}</Text>
            </View>
          </View>
        </View>

        {/* Subject */}
        <View style={styles.subjectSection}>
          <Text style={styles.subjectText}>Subject: Project Completion Certification</Text>
          <Text style={[styles.subjectText, { fontSize: 11 }]}>الموضوع: شهادة إتمام وإنجاز المشروع</Text>
        </View>

        <Text style={styles.introText}>
          This is to certify that the following works and services have been successfully completed, 
          inspected, and handed over in full compliance with the agreed specifications and project requirements.
        </Text>

        {/* Table of Completed Works */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.colNo}>
              <Text style={styles.headerText}>#</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.headerText}>Description of Completed Works</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>وصف الأعمال المنجزة</Text>
            </View>
            <View style={styles.colQty}>
              <Text style={styles.headerText}>Quantity</Text>
              <Text style={[styles.headerText, { fontSize: 7 }]}>الكمية</Text>
            </View>
          </View>

          {(quotation.items || []).filter(item => !!item).map((item, i) => (
            <View key={item.id || i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#fff' : '#fcfdfd' }]}>
              <View style={styles.colNo}>
                <Text style={{ fontSize: 9 }}>{i + 1}</Text>
              </View>
              <View style={styles.colDesc}>
                <Text style={styles.descEn}>{String(item.description || '')}</Text>
              </View>
              <Text style={styles.colQty}>{String(item.quantity || 0)}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.introText, { marginTop: 10 }]}>
          Based on the above, the project is hereby marked as COMPLETED. This certificate acts as 
          the formal handover document for the client's final acceptance.
        </Text>

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

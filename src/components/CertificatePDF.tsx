import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Quotation, Client, CompanySettings } from '@/types';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#334155',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '2pt solid #e2e8f0',
    paddingBottom: 20
  },
  logo: {
    width: 140,
    height: 60,
    objectFit: 'contain'
  },
  companyInfo: {
    alignItems: 'flex-end',
    fontSize: 9,
    color: '#64748b'
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    letterSpacing: 1
  },
  body: {
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 1.8,
    fontSize: 11
  },
  bodyText: {
    marginBottom: 15,
    textAlign: 'justify'
  },
  highlight: {
    fontWeight: 'bold',
    color: '#0f172a'
  },
  detailsBox: {
    marginTop: 15,
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1pt solid #e2e8f0'
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8
  },
  detailLabel: {
    width: 150,
    fontWeight: 'bold',
    color: '#475569'
  },
  detailValue: {
    flex: 1,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: 2,
    borderBottomColor: '#3b82f6',
    paddingBottom: 8,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
  },
  colDesc: { flex: 1 },
  colUnit: { width: '20%', textAlign: 'center' },
  colQty: { width: '20%', textAlign: 'center' },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60
  },
  signatureBlock: {
    width: 200,
    alignItems: 'center'
  },
  signatureLine: {
    width: '100%',
    borderTop: '1pt solid #cbd5e1',
    marginTop: 50,
    marginBottom: 8
  },
  signatureTitle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 15
  }
});

interface Props {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
}

export const CertificatePDF = ({ quotation, client, settings }: Props) => {
  const currentDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {settings.logo ? (
            <Image src={settings.logo} style={styles.logo} />
          ) : (
            <View style={{ width: 140 }}>
              <Text style={styles.companyName}>{settings.name}</Text>
            </View>
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{settings.name}</Text>
            <Text>{settings.address}</Text>
            <Text>Contact: {settings.contact}</Text>
            {settings.vatNumber && <Text>VAT: {settings.vatNumber}</Text>}
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Work Completion Certificate</Text>
          <Text style={styles.subtitle}>CERTIFICATE OF PRACTICAL COMPLETION</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.bodyText}>
            This document serves as formal certification that the work, services, and materials detailed under <Text style={styles.highlight}>Quotation #{quotation.number}</Text> have been fully and satisfactorily completed.
          </Text>

          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Client Name:</Text>
              <Text style={styles.detailValue}>{client.name}</Text>
            </View>
            {quotation.poNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PO Number:</Text>
                <Text style={styles.detailValue}>{quotation.poNumber}</Text>
              </View>
            )}
            {quotation.ticketNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Ticket Number:</Text>
                <Text style={styles.detailValue}>{quotation.ticketNumber}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Completion Date:</Text>
              <Text style={styles.detailValue}>{currentDate}</Text>
            </View>
          </View>
        </View>

        {/* Scope of Work Table (No Prices) */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Scope of Work / Description</Text>
            <Text style={styles.colUnit}>Unit</Text>
            <Text style={styles.colQty}>Quantity</Text>
          </View>
          {quotation.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.description}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.body}>
          <Text style={styles.bodyText}>
            The project has been reviewed, and it is confirmed that all deliverables have been met. The client accepts the completion of the aforementioned project without any outstanding defects or unfulfilled obligations.
          </Text>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureTitle}>Site Engineer Signature</Text>
          </View>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureTitle}>Client Responsible Person Accepted</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a system-generated document. Issued by {settings.name} on {currentDate}.
        </Text>
      </Page>
    </Document>
  );
};

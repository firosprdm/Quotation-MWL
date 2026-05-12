import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Client, Quotation, CompanySettings } from '@/types';

// Register Arabic Font
Font.register({
  family: 'Amiri',
  src: 'https://fonts.gstatic.com/s/amiri/v26/J7afpDI97zlPjcyrR30OfAt7.ttf'
});

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, borderBottomWidth: 1.5, borderBottomColor: '#000000', paddingBottom: 15 },
  headerLeft: { width: '60%' },
  headerRight: { width: '40%', alignItems: 'flex-end', justifyContent: 'flex-end' },
  companyName: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 4 },
  companyDetails: { fontSize: 8, color: '#333333', marginBottom: 2 },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#000000', marginBottom: 5, textTransform: 'uppercase' },
  dateText: { fontSize: 9, color: '#666666' },
  section: { marginBottom: 20 },
  clientInfoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  clientInfoCol: { width: '48%' },
  clientLabel: { fontSize: 9, color: '#666666', marginBottom: 2, fontWeight: 'bold' },
  clientValue: { fontSize: 10, color: '#000000', marginBottom: 8 },
  table: { width: '100%', marginTop: 10 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: '#000000', paddingBottom: 5, marginBottom: 5 },
  tableHeaderCol: { fontSize: 9, color: '#000000', fontWeight: 'bold' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#cccccc', paddingVertical: 6, alignItems: 'center' },
  tableCol: { fontSize: 9, color: '#333333' },
  colDate: { width: '15%' },
  colRef: { width: '35%' },
  colDebit: { width: '16%', textAlign: 'right' },
  colCredit: { width: '16%', textAlign: 'right' },
  colBalance: { width: '18%', textAlign: 'right' },
  summary: { marginTop: 20, padding: 15, alignSelf: 'flex-end', width: '50%', borderWidth: 0.5, borderColor: '#000000', borderRadius: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 10, color: '#000000', fontWeight: 'bold' },
  summaryValue: { fontSize: 10, color: '#000000' },
  summaryDivider: { borderTopWidth: 1.5, borderTopColor: '#000000', marginVertical: 6 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#000000', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#666666' }
});

interface Props {
  client: Client;
  invoices: Quotation[];
  settings: CompanySettings;
  filters: {
    startDate?: string;
    endDate?: string;
    onlyUnpaid?: boolean;
    reportType?: string;
  };
}

export const PartnerLedgerPDF = ({ client, invoices, settings, filters }: Props) => {
  const startTs = filters.startDate ? new Date(filters.startDate).getTime() : 0;
  const endTs = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;

  // 1. Calculate Initial Balance (All transactions before startDate)
  const previousTransactions = invoices.filter(inv => 
    inv.clientId === client.id && 
    (inv.status === 'approved' || inv.zatcaStatus === 'cleared') && 
    new Date(inv.date || inv.invoiceDate || 0).getTime() < startTs
  );
  
  const prevSales = previousTransactions.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
  const prevPaid = previousTransactions.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);
  let initialBalance = prevSales - prevPaid;

  // 2. Filter Current Transactions
  let currentTransactions = invoices
    .filter(inv => 
      inv.clientId === client.id && 
      (inv.status === 'approved' || inv.zatcaStatus === 'cleared') && 
      new Date(inv.date || inv.invoiceDate || 0).getTime() >= startTs &&
      new Date(inv.date || inv.invoiceDate || 0).getTime() <= endTs
    );

  if (filters.onlyUnpaid) {
    currentTransactions = currentTransactions.filter(inv => (inv.grandTotal || inv.total || 0) > (inv.receivedAmount || 0));
  }

  currentTransactions.sort((a, b) => (a.date || a.invoiceDate || 0) - (b.date || b.invoiceDate || 0));

  let runningBalance = initialBalance;
  const ledgerLines = currentTransactions.flatMap(inv => {
    const lines = [];
    
    // Debit line (Invoice)
    const debit = inv.grandTotal || inv.total || 0;
    runningBalance += debit;
    lines.push({
      date: new Date(inv.date || inv.invoiceDate || 0).toLocaleDateString(),
      ref: inv.invoiceNumber || inv.number || 'Draft',
      debit,
      credit: 0,
      balance: runningBalance
    });

    // Credit line (Payment) if exists
    if (inv.receivedAmount && inv.receivedAmount > 0) {
      const credit = inv.receivedAmount;
      runningBalance -= credit;
      lines.push({
        date: inv.paymentDate ? new Date(inv.paymentDate).toLocaleDateString() : 'Paid',
        ref: `Payment for ${inv.invoiceNumber || inv.number}`,
        debit: 0,
        credit,
        balance: runningBalance
      });
    }

    return lines;
  });

  const totalSales = currentTransactions.reduce((sum, inv) => sum + (inv.grandTotal || inv.total || 0), 0);
  const totalReceived = currentTransactions.reduce((sum, inv) => sum + (inv.receivedAmount || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{settings.name}</Text>
            <Text style={styles.companyDetails}>{settings.address}</Text>
            {settings.vatNumber && <Text style={styles.companyDetails}>VAT No: {settings.vatNumber}</Text>}
            {settings.crNumber && <Text style={styles.companyDetails}>CR No: {settings.crNumber}</Text>}
            {settings.contact && <Text style={styles.companyDetails}>Tel: {settings.contact}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>{filters.reportType === 'soa' ? 'Statement of Account' : 'Partner Ledger Report'}</Text>
            <Text style={styles.dateText}>Generated: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.clientInfoRow}>
          <View style={styles.clientInfoCol}>
            <Text style={styles.clientLabel}>Customer / Partner:</Text>
            <Text style={styles.clientValue}>{client.name}</Text>
            {client.address && <Text style={styles.companyDetails}>{client.address}</Text>}
            {client.vatNumber && <Text style={styles.companyDetails}>VAT: {client.vatNumber}</Text>}
          </View>
          <View style={styles.clientInfoCol}>
            <Text style={styles.clientLabel}>Report Period:</Text>
            <Text style={styles.clientValue}>{filters.startDate || 'Beginning of time'} to {filters.endDate || 'Present'}</Text>
            <Text style={styles.clientLabel}>Currency:</Text>
            <Text style={styles.clientValue}>SAR</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colDate]}>Date</Text>
            <Text style={[styles.tableHeaderCol, styles.colRef]}>Reference</Text>
            <Text style={[styles.tableHeaderCol, styles.colDebit]}>{filters.reportType === 'soa' ? 'Debit (Sales)' : 'Debit (Invoice)'}</Text>
            <Text style={[styles.tableHeaderCol, styles.colCredit]}>{filters.reportType === 'soa' ? 'Credit (Paid)' : 'Credit (Payment)'}</Text>
            <Text style={[styles.tableHeaderCol, styles.colBalance]}>Balance</Text>
          </View>

          {ledgerLines.map((line, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.colDate]}>{line.date}</Text>
              <Text style={[styles.tableCol, styles.colRef]}>{line.ref}</Text>
              <Text style={[styles.tableCol, styles.colDebit]}>{line.debit > 0 ? line.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</Text>
              <Text style={[styles.tableCol, styles.colCredit]}>{line.credit > 0 ? line.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</Text>
              <Text style={[styles.tableCol, styles.colBalance]}>{line.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Initial Balance</Text>
            <Text style={styles.summaryValue}>{initialBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period Debit (+)</Text>
            <Text style={styles.summaryValue}>{totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period Credit (-)</Text>
            <Text style={styles.summaryValue}>{totalReceived.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ending Balance</Text>
            <Text style={styles.summaryValue}>{(initialBalance + totalSales - totalReceived).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{settings.name} | Statement of Account</Text>
          <Text 
            style={styles.footerText} 
            render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} 
          />
        </View>
      </Page>
    </Document>
  );
};

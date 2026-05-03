import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { Account, CompanySettings } from '@/types';

Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 500 }
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Open Sans',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 500,
    color: '#0f172a',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: '#3b82f6',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 500,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    padding: 5,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowText: {
    fontSize: 9,
    color: '#334155',
  },
  rowAmount: {
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    marginTop: 5,
  },
  totalText: {
    fontSize: 10,
    fontWeight: 500,
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 10,
    fontWeight: 500,
    fontFamily: 'Helvetica',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCol: {
    fontSize: 8,
    fontWeight: 500,
    color: '#64748b',
  },
  summaryCard: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 15,
  }
});

interface Props {
  type: 'balance-sheet' | 'pnl' | 'trial-balance' | 'ksa-profitability' | 'ksa-wip' | 'ksa-ar-ageing' | 'ksa-vat' | 'ksa-zakat';
  accounts: Account[];
  settings: CompanySettings;
  extraData: any;
}

export function FinancialReportPDF({ type, accounts, settings, extraData }: Props) {
  const assets = accounts.filter(a => a.type === 'Asset');
  const liabilities = accounts.filter(a => a.type === 'Liability');
  const equity = accounts.filter(a => a.type === 'Equity');
  const revenue = accounts.filter(a => a.type === 'Revenue');
  const expenses = accounts.filter(a => a.type === 'Expense');

  const totalAssets = assets.reduce((acc, a) => acc + a.balance, 0);
  const totalLiabilities = liabilities.reduce((acc, a) => acc + a.balance, 0);
  const totalEquityBase = equity.reduce((acc, a) => acc + a.balance, 0);
  const totalRevenue = revenue.reduce((acc, a) => acc + a.balance, 0);
  const totalExpenses = expenses.reduce((acc, a) => acc + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalEquityAndLiabilities = totalLiabilities + totalEquityBase + netIncome;

  const renderBalanceSheet = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assets</Text>
        {assets.map(acc => (
          <View key={acc.id} style={styles.row}>
            <Text style={styles.rowText}>{acc.name}</Text>
            <Text style={styles.rowAmount}>{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Assets</Text>
          <Text style={styles.totalAmount}>{totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Liabilities</Text>
        {liabilities.map(acc => (
          <View key={acc.id} style={styles.row}>
            <Text style={styles.rowText}>{acc.name}</Text>
            <Text style={styles.rowAmount}>{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Liabilities</Text>
          <Text style={styles.totalAmount}>{totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equity</Text>
        {equity.map(acc => (
          <View key={acc.id} style={styles.row}>
            <Text style={styles.rowText}>{acc.name}</Text>
            <Text style={styles.rowAmount}>{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.rowText}>Current Year Earnings</Text>
          <Text style={styles.rowAmount}>{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Equity</Text>
          <Text style={styles.totalAmount}>{(totalEquityBase + netIncome).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total Liabilities & Equity</Text>
        <Text style={styles.totalAmount}>{totalEquityAndLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );

  const renderPnL = () => (
    <View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue</Text>
        {revenue.map(acc => (
          <View key={acc.id} style={styles.row}>
            <Text style={styles.rowText}>{acc.name}</Text>
            <Text style={styles.rowAmount}>{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Revenue</Text>
          <Text style={styles.totalAmount}>{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expenses</Text>
        {expenses.map(acc => (
          <View key={acc.id} style={styles.row}>
            <Text style={styles.rowText}>{acc.name}</Text>
            <Text style={styles.rowAmount}>{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total Expenses</Text>
          <Text style={styles.totalAmount}>{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
        </View>
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Net Income</Text>
        <Text style={styles.totalAmount}>{netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
      </View>
    </View>
  );

  const renderTrialBalance = () => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCol, { width: '15%' }]}>Code</Text>
        <Text style={[styles.tableCol, { width: '45%' }]}>Account Name</Text>
        <Text style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>Debit (SAR)</Text>
        <Text style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>Credit (SAR)</Text>
      </View>
      {accounts.filter(a => a.balance !== 0).map(acc => {
        const isDebit = acc.type === 'Asset' || acc.type === 'Expense';
        return (
          <View key={acc.id} style={styles.row}>
            <Text style={[styles.rowText, { width: '15%' }]}>{acc.code}</Text>
            <Text style={[styles.rowText, { width: '45%' }]}>{acc.name}</Text>
            <Text style={[styles.rowAmount, { width: '20%', textAlign: 'right' }]}>
              {isDebit ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
            </Text>
            <Text style={[styles.rowAmount, { width: '20%', textAlign: 'right' }]}>
              {!isDebit ? acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderProfitability = () => (
    <View>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableCol, { width: '20%' }]}>Project Ref</Text>
        <Text style={[styles.tableCol, { width: '30%' }]}>Client / Title</Text>
        <Text style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>Budget</Text>
        <Text style={[styles.tableCol, { width: '15%', textAlign: 'right' }]}>Actual</Text>
        <Text style={[styles.tableCol, { width: '20%', textAlign: 'right' }]}>Margin</Text>
      </View>
      {extraData.profitabilityData.map((d: any) => (
        <View key={d.quote.id} style={styles.row}>
          <Text style={[styles.rowText, { width: '20%' }]}>{d.quote.number}</Text>
          <Text style={[styles.rowText, { width: '30%' }]}>{d.quote.projectName || 'Untitled'}</Text>
          <Text style={[styles.rowAmount, { width: '15%', textAlign: 'right' }]}>{d.budget.toLocaleString()}</Text>
          <Text style={[styles.rowAmount, { width: '15%', textAlign: 'right' }]}>{d.actualCost.toLocaleString()}</Text>
          <Text style={[styles.rowAmount, { width: '20%', textAlign: 'right' }]}>{d.marginPercent.toFixed(1)}%</Text>
        </View>
      ))}
    </View>
  );

  const renderWIP = () => (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.rowText}>Costs Incurred (WIP): {extraData.wipBalance.toLocaleString()}</Text>
        <Text style={styles.rowText}>Progress Billings: {extraData.progressBillingsBalance.toLocaleString()}</Text>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 5 }}>
          <Text style={styles.totalText}>
            {extraData.netWip > 0 ? "Under-Billing (Asset): " : "Over-Billing (Liability): "}
            {Math.abs(extraData.netWip).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderARAgeing = () => (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.rowText}>Standard Receivables: {extraData.currentAR.toLocaleString()}</Text>
        <Text style={styles.rowText}>Retention Receivables: {extraData.retentionBalance.toLocaleString()}</Text>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 5 }}>
          <Text style={styles.totalText}>Total Expected Cash Flow: {(extraData.currentAR + extraData.retentionBalance).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const renderVAT = () => (
    <View>
      <View style={styles.summaryCard}>
        <Text style={styles.rowText}>Output VAT (Collected): {extraData.vatOutput.toLocaleString()}</Text>
        <Text style={styles.rowText}>Input VAT (Paid): {extraData.vatInput.toLocaleString()}</Text>
        <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 5 }}>
          <Text style={styles.totalText}>
            {extraData.netVatPayable > 0 ? "Net Tax Payable: " : "Net Tax Recoverable: "}
            {Math.abs(extraData.netVatPayable).toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderZakat = () => (
    <View>
      <View style={styles.section}>
        <View style={styles.row}><Text style={styles.rowText}>Net Income</Text><Text style={styles.rowAmount}>{netIncome.toLocaleString()}</Text></View>
        <View style={styles.row}><Text style={styles.rowText}>Equity & Liabilities Base</Text><Text style={styles.rowAmount}>{(extraData.totalLiabilities + extraData.totalEquityBase).toLocaleString()}</Text></View>
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Estimated Zakat Base</Text>
          <Text style={styles.totalAmount}>{extraData.zakatBaseEstimate.toLocaleString()}</Text>
        </View>
        <View style={[styles.totalRow, { borderTopWidth: 0 }]}>
          <Text style={styles.totalText}>Estimated Zakat Provision (2.5%)</Text>
          <Text style={styles.totalAmount}>{extraData.zakatProvision.toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );

  const getTitle = () => {
    switch (type) {
      case 'balance-sheet': return 'Balance Sheet';
      case 'pnl': return 'Profit & Loss Statement';
      case 'trial-balance': return 'Trial Balance';
      case 'ksa-profitability': return 'Project Profitability Report';
      case 'ksa-wip': return 'WIP Schedule';
      case 'ksa-ar-ageing': return 'AR Ageing & Retention';
      case 'ksa-vat': return 'ZATCA VAT Return';
      case 'ksa-zakat': return 'Zakat Lead Schedule';
      default: return 'Financial Report';
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{settings.name}</Text>
          <Text style={styles.reportTitle}>{getTitle()}</Text>
          <Text style={styles.date}>{extraData.dateRangeText}</Text>
        </View>

        {type === 'balance-sheet' && renderBalanceSheet()}
        {type === 'pnl' && renderPnL()}
        {type === 'trial-balance' && renderTrialBalance()}
        {type === 'ksa-profitability' && renderProfitability()}
        {type === 'ksa-wip' && renderWIP()}
        {type === 'ksa-ar-ageing' && renderARAgeing()}
        {type === 'ksa-vat' && renderVAT()}
        {type === 'ksa-zakat' && renderZakat()}
      </Page>
    </Document>
  );
}

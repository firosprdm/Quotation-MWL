import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: 2, borderBottomColor: '#10b981', paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#10b981' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 10, backgroundColor: '#f8fafc', padding: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, paddingBottom: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 10, color: '#64748b' },
  value: { fontSize: 10, fontWeight: 'bold', color: '#1e293b' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8', borderTop: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  badge: { padding: '2 6', borderRadius: 4, fontSize: 8, fontWeight: 'bold' },
  statusActive: { backgroundColor: '#d1fae5', color: '#059669' },
  statusWarning: { backgroundColor: '#ffedd5', color: '#d97706' },
  kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  kpiCard: { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, borderLeft: 4, borderLeftColor: '#3b82f6' },
  kpiLabel: { fontSize: 8, color: '#64748b', marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' }
});

interface Props {
  data: {
    totalRevenue: number;
    totalEmployees: number;
    wpsRatio: number;
    saudizationLevel: string;
    date: string;
    companyName: string;
  }
}

export const ComplianceAuditPDF = ({ data }: Props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Regulatory Compliance Audit</Text>
          <Text style={{ fontSize: 10, color: '#64748b' }}>Ministry of Investment (MISA) & ZATCA Unified Report</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{data.companyName}</Text>
          <Text style={{ fontSize: 8, color: '#94a3b8' }}>Report Date: {data.date}</Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Revenue (SAR)</Text>
          <Text style={styles.kpiValue}>{data.totalRevenue.toLocaleString()}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Employees</Text>
          <Text style={styles.kpiValue}>{data.totalEmployees}</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.kpiLabel}>WPS Compliance</Text>
          <Text style={styles.kpiValue}>{data.wpsRatio}%</Text>
        </View>
        <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.kpiLabel}>Saudization</Text>
          <Text style={styles.kpiValue}>{data.saudizationLevel}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MISA Investment Compliance</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Quarterly Financial Submission</Text>
          <Text style={styles.value}>READY</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Investment License Status</Text>
          <Text style={styles.value}>VALID (Expires 2026)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Foreign Investment Ratio</Text>
          <Text style={styles.value}>100% (Foreign Branch)</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ZATCA & Tax Integration</Text>
        <View style={styles.row}>
          <Text style={styles.label}>E-Invoicing Phase 2 Integration</Text>
          <Text style={styles.value}>CERTIFIED</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>VAT Compliance Status</Text>
          <Text style={styles.value}>UP-TO-DATE</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Zakat/Tax Certificate</Text>
          <Text style={styles.value}>ACTIVE</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Labor & Wage Protection (WPS)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Wage Protection Ratio</Text>
          <Text style={styles.value}>{data.wpsRatio}% (Green Zone)</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Qiwa / Saudization Level</Text>
          <Text style={styles.value}>{data.saudizationLevel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>GOSI Contribution History</Text>
          <Text style={styles.value}>FULLY RECONCILED</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>This is an electronically generated compliance audit from the MARINA CO Financial Suite.</Text>
        <Text>Powered by ZATCA & MISA Unified Integration Gateway.</Text>
      </View>
    </Page>
  </Document>
);

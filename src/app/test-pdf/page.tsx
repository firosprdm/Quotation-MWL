'use client';
import { OnDemandPDFDownload } from '@/components/OnDemandPDFDownload';
import { QuotationPDF } from '@/components/QuotationPDF';
import { useApp } from '@/context/AppContext';
import { useEffect, useState } from 'react';

export default function TestPdf() {
  const { quotations, clients, settings } = useApp();
  const [q, setQ] = useState<any>(null);
  const [c, setC] = useState<any>(null);

  useEffect(() => {
    if (quotations.length > 0 && clients.length > 0) {
      setQ(quotations[0]);
      setC(clients[0]);
    }
  }, [quotations, clients]);

  if (!q || !c) return <div>Loading...</div>;

  return (
    <div style={{ padding: 100 }}>
      <h1>Test PDF</h1>
      <OnDemandPDFDownload 
        document={<QuotationPDF quotation={q} client={c} settings={settings} />} 
        fileName="test.pdf"
        icon={<span>Download PDF</span>}
      />
    </div>
  );
}

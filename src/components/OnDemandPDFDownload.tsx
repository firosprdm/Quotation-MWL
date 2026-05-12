'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';

import { pdf } from '@react-pdf/renderer';

interface Props {
  document: React.ReactElement;
  fileName: string;
  className?: string;
  title?: string;
  icon: React.ReactNode;
}

export function OnDemandPDFDownload({ document: pdfDoc, fileName, className, title, icon }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading) return;
    
    setLoading(true);
    
    // Attempt Safari workaround: open window synchronously
    let newWindow: Window | null = null;
    if (typeof window !== 'undefined' && navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
      newWindow = window.open('', '_blank');
      if (newWindow) newWindow.document.write('Generating PDF, please wait...');
    }

    try {
      // Use static pdf() import which is completely reliable
      const blob = await pdf(pdfDoc as any).toBlob();
      
      if (!blob) throw new Error('Blob generation failed');

      const url = window.URL.createObjectURL(blob);
      
      if (newWindow) {
        newWindow.location.href = url;
      } else {
        const link = window.document.createElement('a');
        link.style.display = 'none';
        link.href = url;
        link.setAttribute('download', fileName);
        window.document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          window.document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
      }
    } catch (e: any) {
      console.error('PDF Generation Error:', e);
      if (newWindow) newWindow.close();
      alert(`Failed to generate PDF: ${e && e.message ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload} 
      className={className} 
      disabled={loading}
      title={title}
    >
      <div className={clsx("flex items-center gap-2", loading && "animate-pulse")}>
        {icon}
      </div>
    </button>
  );
}

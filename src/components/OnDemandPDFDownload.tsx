'use client';

import React, { useState } from 'react';
import { clsx } from 'clsx';

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
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const blob = await pdf(pdfDoc as any).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('PDF Generation Error:', e);
      alert('Failed to generate PDF. Please try again.');
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
      <div className={clsx(loading && "animate-pulse")}>
        {icon}
      </div>
    </button>
  );
}

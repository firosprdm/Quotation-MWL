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
      // Ensure we are getting a fresh blob each time
      const blob = await pdf(pdfDoc as any).toBlob();
      
      if (!blob) throw new Error('Blob generation failed');

      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.setAttribute('download', fileName);
      
      // Append to body for compatibility with some browsers
      window.document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (e) {
      console.error('PDF Generation Error:', e);
      alert('Failed to generate PDF. This might be due to a browser restriction or high system load. Please try again or refresh the page.');
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

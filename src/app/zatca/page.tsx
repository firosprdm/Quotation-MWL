'use client';

import React from 'react';
import { ZatcaDashboard } from '@/components/ZatcaDashboard';
import { motion } from 'framer-motion';

export default function ZatcaPage() {
  return (
    <div className="w-full px-4 sm:px-10 space-y-10">
      <ZatcaDashboard />
    </div>
  );
}

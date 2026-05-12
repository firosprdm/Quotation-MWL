'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building, 
  MapPin, 
  Hash, 
  Phone, 
  User, 
  Upload, 
  Save,
  Globe,
  Navigation,
  ShieldCheck,
  Key,
  RefreshCw,
  Copy,
  CheckCircle2,
  Database,
  Download
} from 'lucide-react';
import { completeZatcaOnboardingAction } from '../actions/zatca-onboarding-action';
import styles from './settings.module.css';
import { clsx } from 'clsx';

export default function SettingsPage() {
  const { settings, updateSettings, exportData, importData, currentUser } = useApp();
  const isAdmin = currentUser?.role === 'admin';
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'idle' | 'csr_generated' | 'completed'>('idle');
  const [egsDetails, setEgsDetails] = useState({
    serialNumber: settings.zatca?.egsSerialNumber || '',
    commonName: settings.zatca?.commonName || '',
    otp: ''
  });
  const [csrData, setCsrData] = useState<{ privateKey: string, csr: string } | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportData = () => {
    const dataToExport = {
      ...exportData(),
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Full_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const json = JSON.parse(content);
          if (confirm("This will overwrite all current data in the cloud. Are you sure?")) {
            await importData(json);
            alert("Data restored successfully! The application will now reload.");
            window.location.reload();
          }
        } catch (err) {
          alert("Invalid backup file: " + err);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // ZATCA Phase 2 Validation
    const { vatNumber, crNumber, splitAddress } = formData;
    
    if (!vatNumber.startsWith('3') || vatNumber.length !== 15) {
      alert('VAT Number must be 15 digits and start with 3.');
      return;
    }

    if (splitAddress) {
      if (!/^\d{4}$/.test(splitAddress.buildingNumber)) {
        alert('Building Number must be exactly 4 digits.');
        return;
      }
      if (!/^\d{5}$/.test(splitAddress.postalCode)) {
        alert('Postal Code must be exactly 5 digits.');
        return;
      }
    } else {
      alert('Address details are mandatory for ZATCA Phase 2.');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      updateSettings(formData);
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  const handleCompleteOnboarding = async () => {
    if (!egsDetails.serialNumber || !egsDetails.commonName) {
      alert('Please enter EGS Serial Number and Device Name.');
      return;
    }
    if (!egsDetails.otp || egsDetails.otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP.');
      return;
    }

    setIsOnboarding(true);

    if (egsDetails.otp === '000000') {
      // Mock Onboarding Bypass
      const mockZatca = {
        ...formData.zatca,
        onboarded: true,
        mode: 'simulation',
        egsSerialNumber: egsDetails.serialNumber,
        commonName: egsDetails.commonName,
        privateKey: 'mock-private-key',
        csr: 'mock-csr',
        complianceCertificate: 'mock-compliance-cert',
        complianceApiSecret: 'mock-compliance-secret',
        productionCertificate: 'mock-production-cert',
        productionApiSecret: 'mock-production-secret'
      };
      
      setFormData({ ...formData, zatca: mockZatca as any });
      updateSettings({ ...formData, zatca: mockZatca as any });
      setOnboardingStep('completed');
      alert('Mock ZATCA Onboarding Complete! You bypassed the Sandbox.');
      setIsOnboarding(false);
      return;
    }

    try {
      const response = await fetch('/api/zatca/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otp: egsDetails.otp,
          vatNumber: formData.vatNumber,
          companyName: formData.name,
          crNumber: formData.crNumber,
          city: formData.splitAddress?.city,
          district: formData.splitAddress?.district,
          street: formData.splitAddress?.streetName,
          building: formData.splitAddress?.buildingNumber,
          postalZone: formData.splitAddress?.postalCode,
        })
      });

      const result = await response.json();

      if (result.success && result.data) {
        const updatedZatca = {
          ...formData.zatca,
          onboarded: true,
          mode: 'sandbox',
          egsSerialNumber: egsDetails.serialNumber,
          commonName: egsDetails.commonName,
          privateKey: result.data.privateKey,
          csr: result.data.csr,
          complianceCertificate: result.data.complianceCertificate,
          complianceApiSecret: result.data.complianceApiSecret,
          productionCertificate: result.data.productionCertificate,
          productionApiSecret: result.data.productionApiSecret,
        };
        
        setFormData({ ...formData, zatca: updatedZatca as any });
        updateSettings({ ...formData, zatca: updatedZatca as any });
        setOnboardingStep('completed');
        alert('ZATCA Simulation Onboarding completed successfully! Your Unit is now connected.');
      } else {
        alert('ZATCA Onboarding Failed: ' + (result.error || 'Unknown Error'));
      }
    } catch (error: any) {
      alert('ZATCA Onboarding Failed: ' + error.message);
    } finally {
      setIsOnboarding(false);
    }
  };

  const handleSplitAddressChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      splitAddress: {
        ...(formData.splitAddress || {
          buildingNumber: '',
          streetName: '',
          district: '',
          city: 'Riyadh',
          postalCode: '',
          countryCode: 'SA'
        }),
        [field]: value
      }
    });
  };

  return (
    <div className="fade-in">
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>Company Settings</h2>
          <p className={styles.subtitle}>Manage your company details for quotation branding.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <section className={clsx('glass-panel', styles.section)}>
              <div className={styles.sectionHeader}>
                <Building size={20} className="text-blue-400" />
                <h3>Company Profile</h3>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Company Name</label>
                  <div className={styles.inputWrapper}>
                    <Building className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.name} 
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>VAT Registration Number</label>
                  <div className={styles.inputWrapper}>
                    <Hash className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.vatNumber} 
                      onChange={e => setFormData({ ...formData, vatNumber: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Contact Details</label>
                  <div className={styles.inputWrapper}>
                    <Phone className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.contact} 
                      onChange={e => setFormData({ ...formData, contact: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Sales Person Name</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.salesPerson} 
                      onChange={e => setFormData({ ...formData, salesPerson: e.target.value })}
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Commercial Registration (CR) ID</label>
                  <div className={styles.inputWrapper}>
                    <Hash className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.crNumber || ''} 
                      onChange={e => setFormData({ ...formData, crNumber: e.target.value })}
                      placeholder="e.g. 1010000000"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Building Number (4 Digits)</label>
                  <div className={styles.inputWrapper}>
                    <Navigation className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      maxLength={4}
                      value={formData.splitAddress?.buildingNumber || ''} 
                      onChange={e => handleSplitAddressChange('buildingNumber', e.target.value)}
                      placeholder="e.g. 1234"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Street Name</label>
                  <div className={styles.inputWrapper}>
                    <MapPin className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.splitAddress?.streetName || ''} 
                      onChange={e => handleSplitAddressChange('streetName', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>District</label>
                  <div className={styles.inputWrapper}>
                    <MapPin className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.splitAddress?.district || ''} 
                      onChange={e => handleSplitAddressChange('district', e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>City</label>
                  <div className={styles.inputWrapper}>
                    <Globe className={styles.inputIcon} size={18} />
                    <select 
                      className="glass-input w-full bg-slate-900/50" 
                      value={formData.splitAddress?.city || 'Riyadh'} 
                      onChange={e => handleSplitAddressChange('city', e.target.value)}
                    >
                      <option value="Riyadh">Riyadh</option>
                      <option value="Jeddah">Jeddah</option>
                      <option value="Dammam">Dammam</option>
                      <option value="Khobar">Khobar</option>
                      <option value="Abha">Abha</option>
                      <option value="Tabuk">Tabuk</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Postal Code (5 Digits)</label>
                  <div className={styles.inputWrapper}>
                    <Hash className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      maxLength={5}
                      value={formData.splitAddress?.postalCode || ''} 
                      onChange={e => handleSplitAddressChange('postalCode', e.target.value)}
                      placeholder="e.g. 12211"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Country Code</label>
                  <div className={styles.inputWrapper}>
                    <Globe className={styles.inputIcon} size={18} />
                    <select 
                      className="glass-input w-full bg-slate-900/50" 
                      value={formData.splitAddress?.countryCode || 'SA'} 
                      onChange={e => handleSplitAddressChange('countryCode', e.target.value)}
                    >
                      <option value="SA">Saudi Arabia (SA)</option>
                    </select>
                  </div>
                </div>

                <div className={clsx(styles.formGroup, styles.fullWidth)}>
                  <label>Legacy Address (For Print Only)</label>
                  <div className={styles.inputWrapper}>
                    <MapPin className={styles.inputIcon} size={18} />
                    <textarea 
                      className="glass-input" 
                      rows={2}
                      value={formData.address} 
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className={styles.rightCol}>
            <section className={clsx('glass-panel', styles.section)}>
              <div className={styles.sectionHeader}>
                <Upload size={20} className="text-purple-400" />
                <h3>Company Logo</h3>
              </div>
              
              <div className={styles.logoUploadArea} onClick={() => document.getElementById('logo-upload')?.click()}>
                <input 
                  id="logo-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                {formData.logo ? (
                  <div className={styles.logoPreview}>
                    <img src={formData.logo} alt="Company Logo" />
                    <button 
                      type="button" 
                      className={styles.removeLogo}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData({ ...formData, logo: undefined });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <Upload size={48} className="text-muted mb-4" />
                    <p>Click to upload logo</p>
                    <span>PNG, JPG or SVG (Max 2MB)</span>
                  </div>
                )}
              </div>
            </section>

            <section className={clsx('glass-panel', styles.section, styles.onboardingSection)}>
              <div className={styles.sectionHeader}>
                <ShieldCheck size={20} className="text-emerald-400" />
                <h3>ZATCA Phase 2 Onboarding</h3>
                <div className={clsx(styles.statusBadge, formData.zatca?.onboarded ? styles.statusOnboarded : styles.statusNotOnboarded)}>
                  {formData.zatca?.onboarded ? (
                    <>
                      <CheckCircle2 size={14} />
                      Onboarded
                    </>
                  ) : 'Not Onboarded'}
                </div>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>EGS Serial Number</label>
                  <div className={styles.inputWrapper}>
                    <Hash className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. 1-UNIT|2-SERIAL|3-DEVICE"
                      value={egsDetails.serialNumber}
                      onChange={e => setEgsDetails({ ...egsDetails, serialNumber: e.target.value })}
                      disabled={formData.zatca?.onboarded}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Device Name (CN)</label>
                  <div className={styles.inputWrapper}>
                    <Building className={styles.inputIcon} size={18} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. OFFICE-UNIT-01"
                      value={egsDetails.commonName}
                      onChange={e => setEgsDetails({ ...egsDetails, commonName: e.target.value })}
                      disabled={formData.zatca?.onboarded}
                    />
                  </div>
                </div>
              </div>

              {!formData.zatca?.onboarded ? (
                <div className={styles.onboardingResult}>
                  <div className={styles.formGroup}>
                    <label>Enter ZATCA OTP</label>
                    <div className={styles.inputWrapper}>
                      <Hash className={styles.inputIcon} size={18} />
                      <input 
                        type="text" 
                        className="glass-input" 
                        placeholder="6-digit OTP from Fatoora portal"
                        value={egsDetails.otp}
                        onChange={e => setEgsDetails({ ...egsDetails, otp: e.target.value })}
                        maxLength={6}
                      />
                    </div>
                    <button 
                      type="button" 
                      className={clsx(styles.onboardBtn, "mt-4 bg-emerald-600/20 text-emerald-400 border-emerald-600/30")}
                      onClick={handleCompleteOnboarding}
                      disabled={isOnboarding}
                    >
                      <ShieldCheck size={18} />
                      {isOnboarding ? 'Onboarding in progress...' : 'Complete ZATCA Onboarding'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.onboardingResult}>
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    This unit is registered with ZATCA for Phase 2 Integration.
                  </p>
                  <button 
                    type="button" 
                    className="text-sm text-rose-400 mt-4 underline"
                    onClick={() => setFormData({ ...formData, zatca: { onboarded: false } })}
                  >
                    Reset Onboarding (Caution)
                  </button>
                </div>
              )}
            </section>

            <section className={clsx('glass-panel', styles.section)}>
              <div className={styles.sectionHeader}>
                <Database size={20} className="text-orange-400" />
                <h3>Data Backup & Restore</h3>
              </div>
              <p className="text-sm text-muted mb-4">
                Export all your clients, quotations, invoices, and settings to a local JSON file, or restore from a backup.
              </p>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  className={clsx(styles.onboardBtn, "flex-1 bg-orange-500/10 text-orange-400 border-orange-500/30")}
                  onClick={handleExportData}
                >
                  <Download size={18} />
                  Backup Data
                </button>
                <div className="flex-1 relative">
                  <input 
                    type="file" 
                    accept=".json" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleImportData}
                    disabled={!isAdmin}
                  />
                  <button 
                    type="button" 
                    className={clsx(styles.onboardBtn, "w-full bg-slate-500/10 text-slate-300 border-slate-500/30")}
                    disabled={!isAdmin}
                  >
                    <Upload size={18} />
                    Restore Data
                  </button>
                </div>
              </div>
            </section>

            <button type="submit" className={styles.saveBtn} disabled={isSaving || !isAdmin}>
              <Save size={20} />
              {!isAdmin ? 'Admin Access Required' : (isSaving ? 'Saving Changes...' : 'Save Settings')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

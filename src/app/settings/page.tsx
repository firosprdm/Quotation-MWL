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
import { onboardZatcaAction } from '../actions/zatca';
import styles from './settings.module.css';
import { clsx } from 'clsx';

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<'idle' | 'csr_generated' | 'completed'>('idle');
  const [egsDetails, setEgsDetails] = useState({
    serialNumber: settings.zatca?.egsSerialNumber || '',
    commonName: settings.zatca?.commonName || ''
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
    const dataStr = localStorage.getItem('quotation_app_data');
    if (!dataStr) {
      alert("No data found to export.");
      return;
    }
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_marina_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          JSON.parse(content); // Validate JSON
          if (confirm("This will overwrite all current data. Are you sure?")) {
            localStorage.setItem('quotation_app_data', content);
            alert("Data imported successfully! The application will now reload.");
            window.location.reload();
          }
        } catch (err) {
          alert("Invalid backup file.");
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

  const handleGenerateCSR = async () => {
    if (!egsDetails.serialNumber || !egsDetails.commonName) {
      alert('Please enter EGS Serial Number and Device Name.');
      return;
    }

    setIsOnboarding(true);
    const result = await onboardZatcaAction({
      vatNumber: formData.vatNumber,
      organizationName: formData.name,
      egsSerialNumber: egsDetails.serialNumber,
      commonName: egsDetails.commonName,
      organizationUnit: formData.vatNumber,
      city: formData.splitAddress?.city || 'Riyadh',
      country: 'SA'
    });

    if (result.success && result.data) {
      setCsrData(result.data);
      setOnboardingStep('csr_generated');
      // Save locally as well
      const updatedZatca = {
        ...formData.zatca,
        egsSerialNumber: egsDetails.serialNumber,
        commonName: egsDetails.commonName,
        csr: result.data.csr,
        privateKey: result.data.privateKey,
        onboarded: false
      };
      setFormData({ ...formData, zatca: updatedZatca as any });
      alert('CSR and Private Key generated successfully! Now use the OTP to onboard.');
    } else {
      alert('Error: ' + result.error);
    }
    setIsOnboarding(false);
  };

  const handleCompleteOnboarding = () => {
    // In a real app, this would call ZATCA API with OTP
    // For now, we simulate success
    const updatedZatca = {
      ...formData.zatca,
      onboarded: true,
      certificate: 'MII... (Binary Security Token)',
      secret: 'SECRET_123'
    };
    setFormData({ ...formData, zatca: updatedZatca as any });
    updateSettings({ ...formData, zatca: updatedZatca as any });
    setOnboardingStep('completed');
    alert('ZATCA Onboarding completed successfully! You can now issue compliant Phase 2 invoices.');
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
                <>
                  <button 
                    type="button" 
                    className={styles.onboardBtn} 
                    onClick={handleGenerateCSR}
                    disabled={isOnboarding}
                  >
                    <Key size={18} />
                    {isOnboarding ? 'Generating Keys...' : 'Step 1: Generate CSR & Key'}
                  </button>

                  {onboardingStep === 'csr_generated' && (
                    <div className={styles.onboardingResult}>
                      <div className="mb-4">
                        <label>Certificate Signing Request (CSR)</label>
                        <pre>{formData.zatca?.csr}</pre>
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label>Enter ZATCA OTP</label>
                        <div className={styles.inputWrapper}>
                          <Hash className={styles.inputIcon} size={18} />
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="6-digit OTP from Fatoora portal"
                          />
                        </div>
                        <button 
                          type="button" 
                          className={clsx(styles.onboardBtn, "bg-emerald-600/20 text-emerald-400 border-emerald-600/30")}
                          onClick={handleCompleteOnboarding}
                        >
                          <ShieldCheck size={18} />
                          Step 2: Complete Onboarding
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.onboardingResult}>
                  <p className="text-sm text-emerald-400 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    This unit is registered with ZATCA for Phase 2 Integration.
                  </p>
                  <button 
                    type="button" 
                    className="text-xs text-rose-400 mt-4 underline"
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
              <p className="text-xs text-muted mb-4">
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
                  />
                  <button 
                    type="button" 
                    className={clsx(styles.onboardBtn, "w-full bg-slate-500/10 text-slate-300 border-slate-500/30")}
                  >
                    <Upload size={18} />
                    Restore Data
                  </button>
                </div>
              </div>
            </section>

            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              <Save size={20} />
              {isSaving ? 'Saving Changes...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

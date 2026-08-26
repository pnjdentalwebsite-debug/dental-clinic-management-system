import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ClinicInformationForm } from '../components/ClinicInformationForm';
import { ClinicContactForm } from '../components/ClinicContactForm';
import { ClinicAddressForm } from '../components/ClinicAddressForm';
import { ClinicOperatingHours } from '../components/ClinicOperatingHours';
import { ClinicBrandingCard } from '../components/ClinicBrandingCard';
import { ClinicFormActions } from '../components/ClinicFormActions';

interface Props {
  loggedClinicName: string;
  loggedPlanName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function ClinicProfilePage({ loggedClinicName, loggedPlanName, showToast }: Props) {
  const [info, setInfo] = useState({
    name: loggedClinicName,
    type: 'Dental Clinic',
    regNumber: 'DENT-2026-8849',
    status: 'Active',
    establishedDate: '2020-03-15'
  });

  const [contact, setContact] = useState({
    contactPerson: 'Angelo Mhyr',
    email: 'contact@angelodental.com',
    phone: '+63 917 123 4567',
    website: 'https://angelodental.com'
  });

  const [address, setAddress] = useState({
    country: 'Philippines',
    region: 'Metro Manila',
    province: 'Metro Manila',
    city: 'Quezon City',
    street: '123 Health Ave, Diliman',
    postalCode: '1101'
  });

  const [operating, setOperating] = useState({
    days: 'Monday - Saturday',
    openTime: '09:00',
    closeTime: '18:00'
  });

  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleInfoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleContactChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContact(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleOperatingChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOperating(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadMock = () => {
    setLogoUrl('https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=128&auto=format&fit=crop&q=60');
    showToast('Mock Logo uploaded successfully!', 'success');
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast('Clinic profile changes saved successfully (mock UI only).', 'success');
    }, 800);
  };

  const handleCancel = () => {
    showToast('Changes discarded.', 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      {/* Page Header */}
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Clinic Profile</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage your clinic information, identity, and operational details.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge-prototype" style={{ background: 'var(--success-light)', color: 'var(--success)', borderColor: 'transparent', fontWeight: 600 }}>
            ● Active
          </span>
          <span className="badge-prototype" style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'transparent', fontWeight: 600 }}>
            {loggedPlanName} Subscription
          </span>
        </div>
      </div>

      {/* Main Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ClinicInformationForm data={info} onChange={handleInfoChange} />
          <ClinicContactForm data={contact} onChange={handleContactChange} />
          <ClinicAddressForm data={address} onChange={handleAddressChange} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ClinicBrandingCard logoUrl={logoUrl} onUploadMock={handleUploadMock} />
          <ClinicOperatingHours data={operating} onChange={handleOperatingChange} />
        </div>
      </div>

      {/* Footer Form Actions */}
      <ClinicFormActions onSave={handleSave} onCancel={handleCancel} isSaving={isSaving} />
    </div>
  );
}

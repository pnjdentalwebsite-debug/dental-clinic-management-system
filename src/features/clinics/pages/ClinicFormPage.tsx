import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { ClinicForm } from '../components/ClinicForm';
import { mockClinicService } from '../services/mockClinicService';
import type { ClinicFormData } from '../types';

interface Props {
  mode: 'create' | 'edit';
  clinicId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function ClinicFormPage({ mode, clinicId = '', navigate, showToast }: Props) {
  const [saving, setSaving] = useState(false);
  const foundClinic = mode === 'edit' ? mockClinicService.getClinicById(clinicId) : null;
  const clinic = foundClinic || undefined;
  if (mode === 'edit' && !clinic) return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/clinics')}><ArrowLeft size={16} /> Back to Clinics</button><div className="dashboard-panel empty-state" style={{ marginTop: '1rem' }}><h1>Clinic not found</h1><p>This mock clinic may have been archived or the link is invalid.</p></div></main>;

  const save = (data: ClinicFormData, draft = false, allowPendingOverride = false) => {
    setSaving(true);
    const result = mode === 'create' ? mockClinicService.createClinic(data, draft, allowPendingOverride) : mockClinicService.updateClinic(clinic!.id, data);
    if (result.ok && result.data) {
      showToast(result.warning || (mode === 'create' ? 'Clinic created.' : 'Clinic updated.'), result.warning ? 'warning' : 'success');
      navigate(`/platform/clinics/${result.data.id}`);
    } else {
      setSaving(false);
      showToast(result.error || 'Clinic save failed.', 'error');
    }
  };

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate(clinic ? `/platform/clinics/${clinic.id}` : '/platform/clinics')}><ArrowLeft size={16} /> Back</button>
      <div className="page-header-container"><div><h1>{mode === 'create' ? 'Add New Clinic' : `Edit ${clinic?.name}`}</h1><p className="page-title-desc">{mode === 'create' ? 'Create a mock clinic location with structured hours and initial user assignments.' : 'Edit clinic details, contact information, address, hours, logo metadata, and visibility.'}</p></div></div>
      <ClinicForm mode={mode} clinic={clinic} subscribers={mockPlatformManagementService.listSubscribers()} users={mockPlatformManagementService.listUsers()} saving={saving} onCancel={() => navigate('/platform/clinics')} onSave={save} />
    </main>
  );
}

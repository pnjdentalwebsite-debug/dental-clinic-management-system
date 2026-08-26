import { ArrowLeft } from 'lucide-react';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { LaboratoryForm } from '../components/LaboratoryForm';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import type { LaboratoryFormData } from '../types';

interface Props {
  mode: 'create' | 'edit';
  laboratoryId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function LaboratoryFormPage({ mode, laboratoryId, navigate, showToast }: Props) {
  const laboratory = laboratoryId ? mockLaboratoryService.getLaboratoryById(laboratoryId) || undefined : undefined;
  if (mode === 'edit' && !laboratory) return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/laboratories')}><ArrowLeft size={16} /> Back to Laboratories</button><div className="dashboard-panel empty-state" style={{ marginTop: '1rem' }}><h1>Laboratory not found</h1><p>This mock laboratory record does not exist.</p></div></main>;

  const save = (data: LaboratoryFormData, draft = false, allowPendingOverride = false) => {
    const result = mode === 'create' ? mockLaboratoryService.createLaboratory(data, draft, allowPendingOverride) : mockLaboratoryService.updateLaboratory(laboratory!.id, data);
    if (!result.ok || !result.data) {
      showToast(result.error || 'Laboratory could not be saved.', 'error');
      return;
    }
    showToast(result.warning || `Laboratory ${mode === 'create' ? 'created' : 'updated'}.`, result.warning ? 'warning' : 'success');
    navigate(`/platform/laboratories/${result.data.id}`);
  };

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/platform/laboratories')}><ArrowLeft size={16} /> Back to Laboratories</button>
      <div className="page-header-container"><div><h1>{mode === 'create' ? 'Add Laboratory' : `Edit ${laboratory?.name}`}</h1><p className="page-title-desc">Manage laboratory ownership, contacts, services, turnaround settings, and clinic connections.</p></div></div>
      <LaboratoryForm mode={mode} laboratory={laboratory} subscribers={mockPlatformManagementService.listSubscribers()} clinics={mockClinicService.listClinics()} onCancel={() => navigate(mode === 'edit' && laboratory ? `/platform/laboratories/${laboratory.id}` : '/platform/laboratories')} onSave={save} />
    </main>
  );
}

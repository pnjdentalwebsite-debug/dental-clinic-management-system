import { useMemo, useState, useEffect } from 'react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { CertificateForm } from './CertificateForm';
import { CertificateList } from './CertificateList';
import { CertificatePreview } from './CertificatePreview';
import {
  getLegacyPatientStorageKey,
  getPatientScopedStorageKey
} from '../shared/patientClinicalStorage';
import type {
  CertificateFilter,
  CertificateFormValues,
  CertificateRecord,
  CertificateSort,
  CertificateStatus,
  CertificateTypeOption
} from './certificateTypes';

interface Props {
  patient: PatientPreviewItem;
}

const certificateTypes: CertificateTypeOption[] = [
  {
    id: 'dental-clearance',
    label: 'Dental Clearance',
    description: 'Confirm dental examination status.',
    fields: ['Patient information', 'Examination date', 'Dentist', 'Findings', 'Clearance status']
  },
  {
    id: 'treatment-certificate',
    label: 'Treatment Certificate',
    description: 'Confirm completed dental procedures.',
    fields: ['Treatment performed', 'Treatment date', 'Dentist', 'Remarks']
  },
  {
    id: 'consultation-certificate',
    label: 'Consultation Certificate',
    description: 'Document patient consultation.',
    fields: ['Consultation date', 'Complaint', 'Assessment', 'Recommendation']
  },
  {
    id: 'custom',
    label: 'Custom Certificate',
    description: 'Placeholder for future PDF Designer integration.',
    fields: ['Title', 'Purpose', 'Remarks']
  }
];

const statusOptions: CertificateStatus[] = ['Draft', 'Issued', 'Archived'];
const filterOptions: CertificateFilter[] = ['All', 'Draft', 'Issued', 'Archived'];

const storageKeyPrefix = 'clinicCertificates:';
export const getCertificatesStorageKey = (patientId: string, clinicId?: string) =>
  getPatientScopedStorageKey(storageKeyPrefix, patientId, clinicId);

export const loadCertificates = (patientId: string, clinicId?: string): CertificateRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getCertificatesStorageKey(patientId, clinicId))
      ?? localStorage.getItem(getLegacyPatientStorageKey(storageKeyPrefix, patientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CertificateRecord[]) : [];
  } catch {
    return [];
  }
};

export const saveCertificates = (patientId: string, records: CertificateRecord[], clinicId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getCertificatesStorageKey(patientId, clinicId), JSON.stringify(records));
  } catch {
    // ignore
  }
};

export function CertificateManager({ patient }: Props) {
  const [certificates, setCertificates] = useState<CertificateRecord[]>(() =>
    loadCertificates(patient.id, patient.clinicId)
  );
  const [filter, setFilter] = useState<CertificateFilter>('All');
  const [sort, setSort] = useState<CertificateSort>('newest');
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formOpen, setFormOpen] = useState(false);
  const certificateTypesById = useMemo(
    () => Object.fromEntries(certificateTypes.map((type) => [type.id, type])) as Record<string, CertificateTypeOption>,
    []
  );

  useEffect(() => {
    setCertificates(loadCertificates(patient.id, patient.clinicId));
    setSelectedCertificateId(null);
  }, [patient.id, patient.clinicId]);

  const visibleCertificates = useMemo(() => {
    const filtered = filter === 'All' ? certificates : certificates.filter((certificate) => certificate.status === filter);
    return [...filtered].sort((a, b) => {
      const compare = new Date(a.issuedDate).getTime() - new Date(b.issuedDate).getTime();
      return sort === 'oldest' ? compare : -compare;
    });
  }, [certificates, filter, sort]);

  const selectedCertificate = selectedCertificateId
    ? certificates.find((certificate) => certificate.id === selectedCertificateId) || null
    : visibleCertificates[0] || null;

  const editingCertificate = formMode === 'edit' && selectedCertificateId
    ? certificates.find((certificate) => certificate.id === selectedCertificateId) || null
    : null;

  const activePreviewValues: CertificateFormValues = selectedCertificate
    ? {
        certificateType: selectedCertificate.certificateType,
        title: selectedCertificate.title,
        issuedDate: selectedCertificate.issuedDate,
        dentist: selectedCertificate.dentist,
        purpose: selectedCertificate.purpose,
        remarks: selectedCertificate.remarks,
        status: selectedCertificate.status
      }
    : {
        certificateType: 'dental-clearance',
        title: 'Dental Clearance Certificate',
        issuedDate: new Date().toISOString().split('T')[0],
        dentist: 'Assigned Dentist',
        purpose: 'No certificate selected yet.',
        remarks: 'Select or create a certificate to view details.',
        status: 'Draft'
      };

  const openAddForm = () => {
    setFormMode('add');
    setFormOpen(true);
  };

  const openEditForm = (certificateId: string) => {
    setSelectedCertificateId(certificateId);
    setFormMode('edit');
    setFormOpen(true);
  };

  const deleteCertificate = (certificateId: string) => {
    const nextCertificates = certificates.filter((certificate) => certificate.id !== certificateId);
    setCertificates(nextCertificates);
    saveCertificates(patient.id, nextCertificates, patient.clinicId);
    setSelectedCertificateId((current) => (current === certificateId ? null : current));
  };

  const saveCertificate = (values: CertificateFormValues) => {
    if (formMode === 'edit' && editingCertificate) {
      const nextCertificates = certificates.map((certificate) =>
        certificate.id === editingCertificate.id
          ? {
              ...certificate,
              ...values,
              clinicName: certificate.clinicName
            }
          : certificate
      );
      setCertificates(nextCertificates);
      saveCertificates(patient.id, nextCertificates, patient.clinicId);
      setSelectedCertificateId(editingCertificate.id);
    } else {
      const newCertificate: CertificateRecord = {
        id: `CERT-${Date.now()}`,
        patientId: patient.id,
        ...values,
        clinicName: patient.clinicName || 'Angelo Dental Clinic',
        createdAt: new Date().toISOString()
      };
      const nextCertificates = [newCertificate, ...certificates];
      setCertificates(nextCertificates);
      saveCertificates(patient.id, nextCertificates, patient.clinicId);
      setSelectedCertificateId(newCertificate.id);
    }

    setFormOpen(false);
  };

  return (
    <div className="certificate-manager">
      <div className="certificate-manager__layout">
        <aside className="certificate-manager__sidebar">
          <header className="certificate-manager__header">
            <div>
              <h3 className="certificate-manager__title">Certificates</h3>
              <p className="certificate-manager__subtitle">Create and manage patient certificates.</p>
            </div>
            <button type="button" className="btn btn-primary certificate-manager__add-btn" onClick={openAddForm}>
              New Certificate
            </button>
          </header>

          <div className="certificate-manager__controls" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <select
              className="certificate-manager__select"
              value={filter}
              onChange={(e) => setFilter(e.target.value as CertificateFilter)}
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            >
              {filterOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <select
              className="certificate-manager__select"
              value={sort}
              onChange={(e) => setSort(e.target.value as CertificateSort)}
              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <CertificateList
            certificates={visibleCertificates}
            certificateTypesById={certificateTypesById}
            onCreateFirst={openAddForm}
            onView={(id) => setSelectedCertificateId(id)}
            onEdit={openEditForm}
            onDelete={deleteCertificate}
          />
        </aside>

        <main className="certificate-manager__main">
          <CertificatePreview
            clinicName={selectedCertificate?.clinicName || patient.clinicName || 'Angelo Dental Clinic'}
            patientName={patient.name}
            values={activePreviewValues}
          />

          <CertificateForm
            open={formOpen}
            mode={formMode}
            certificate={editingCertificate}
            certificateTypes={certificateTypes}
            statusOptions={statusOptions}
            onClose={() => setFormOpen(false)}
            onSave={saveCertificate}
          />
        </main>
      </div>
    </div>
  );
}

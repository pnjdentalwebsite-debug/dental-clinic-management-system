import { useMemo, useState } from 'react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import { TreatmentDetails } from './TreatmentDetails';
import { TreatmentForm } from './TreatmentForm';
import { TreatmentList } from './TreatmentList';
import type {
  TreatmentCategory,
  TreatmentFilter,
  TreatmentFormValues,
  TreatmentRecordEntry,
  TreatmentSort,
  TreatmentStatus
} from './treatmentTypes';

interface Props {
  patient: PatientPreviewItem;
}

const treatmentCategories: TreatmentCategory[] = [
  { id: 'preventive', label: 'Preventive', procedures: ['Cleaning', 'Fluoride Application', 'Consultation'] },
  { id: 'restorative', label: 'Restorative', procedures: ['Filling', 'Crown', 'Restoration'] },
  { id: 'endodontic', label: 'Endodontic', procedures: ['Root Canal Treatment'] },
  { id: 'surgical', label: 'Surgical', procedures: ['Extraction'] },
  { id: 'orthodontic', label: 'Orthodontic', procedures: ['Adjustment'] }
];

const statusOptions: TreatmentStatus[] = ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const filterOptions: TreatmentFilter[] = ['All', 'Completed', 'Pending', 'Cancelled'];

const buildMockTreatments = (patientId: string): TreatmentRecordEntry[] => {
  if (patientId === 'P001') {
    return [
      {
        id: 'TR-001',
        patientId,
        date: '2026-07-29',
        procedure: 'Cleaning',
        category: 'preventive',
        toothNumber: 'General',
        dentist: 'Dr. Santos',
        description: 'Routine oral prophylaxis and plaque control.',
        status: 'Completed',
        amount: 1500,
        notes: 'Recall after six months.',
        createdAt: '2026-07-29T09:00:00.000Z'
      },
      {
        id: 'TR-002',
        patientId,
        date: '2026-08-12',
        procedure: 'Filling',
        category: 'restorative',
        toothNumber: '46',
        dentist: 'Dr. Cruz',
        description: 'Class I restoration planned for occlusal caries.',
        status: 'Scheduled',
        amount: 2200,
        notes: 'Confirm anesthetic tolerance before procedure.',
        createdAt: '2026-07-29T09:30:00.000Z'
      }
    ];
  }

  if (patientId === 'P002') {
    return [
      {
        id: 'TR-003',
        patientId,
        date: '2026-06-18',
        procedure: 'Consultation',
        category: 'preventive',
        toothNumber: 'General',
        dentist: 'Dr. Reyes',
        description: 'Restorative follow-up consultation.',
        status: 'Completed',
        amount: 800,
        notes: 'Penicillin allergy noted.',
        createdAt: '2026-06-18T05:00:00.000Z'
      }
    ];
  }

  return [];
};

export function TreatmentRecord({ patient }: Props) {
  const [treatments, setTreatments] = useState<TreatmentRecordEntry[]>(() => buildMockTreatments(patient.id));
  const [filter, setFilter] = useState<TreatmentFilter>('All');
  const [sort, setSort] = useState<TreatmentSort>('newest');
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formOpen, setFormOpen] = useState(false);
  const categoriesById = useMemo(
    () => Object.fromEntries(treatmentCategories.map((category) => [category.id, category])) as Record<string, TreatmentCategory>,
    []
  );

  const visibleTreatments = useMemo(() => {
    const filtered = filter === 'All' ? treatments : treatments.filter((treatment) => treatment.status === filter);
    return [...filtered].sort((a, b) => {
      const compare = new Date(a.date).getTime() - new Date(b.date).getTime();
      return sort === 'oldest' ? compare : -compare;
    });
  }, [filter, sort, treatments]);

  const selectedTreatment = selectedTreatmentId ? treatments.find((treatment) => treatment.id === selectedTreatmentId) || null : visibleTreatments[0] || null;
  const editingTreatment = formMode === 'edit' && selectedTreatmentId
    ? treatments.find((treatment) => treatment.id === selectedTreatmentId) || null
    : null;

  const openAddForm = () => {
    setFormMode('add');
    setFormOpen(true);
  };

  const openEditForm = (treatmentId: string) => {
    setSelectedTreatmentId(treatmentId);
    setFormMode('edit');
    setFormOpen(true);
  };

  const deleteTreatment = (treatmentId: string) => {
    setTreatments((current) => current.filter((treatment) => treatment.id !== treatmentId));
    setSelectedTreatmentId((current) => (current === treatmentId ? null : current));
  };

  const saveTreatment = (values: TreatmentFormValues) => {
    const amount = Number(values.amount.replace(/[^0-9.-]/g, '')) || 0;
    if (formMode === 'edit' && editingTreatment) {
      setTreatments((current) =>
        current.map((treatment) =>
          treatment.id === editingTreatment.id
            ? {
                ...treatment,
                ...values,
                amount,
                toothNumber: values.toothNumber.trim() || 'General'
              }
            : treatment
        )
      );
      setSelectedTreatmentId(editingTreatment.id);
    } else {
      const newTreatment: TreatmentRecordEntry = {
        id: `TR-${Date.now()}`,
        patientId: patient.id,
        ...values,
        amount,
        toothNumber: values.toothNumber.trim() || 'General',
        createdAt: new Date().toISOString()
      };
      setTreatments((current) => [newTreatment, ...current]);
      setSelectedTreatmentId(newTreatment.id);
    }
    setFormOpen(false);
  };

  return (
    <div className="treatment-record-module">
      <section className="patient-record__card treatment-record-header">
        <div>
          <p className="patient-clinical-workspace__eyebrow">Treatment Record</p>
          <h3>Treatment History</h3>
          <span>Complete dental treatment history for {patient.name}.</span>
        </div>
        <button type="button" className="btn btn-primary" onClick={openAddForm}>+ Add Treatment</button>
      </section>

      <section className="patient-record__card treatment-record-toolbar">
        <label>
          <span>Filter</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value as TreatmentFilter)}>
            {filterOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as TreatmentSort)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <strong>{visibleTreatments.length} record{visibleTreatments.length === 1 ? '' : 's'}</strong>
      </section>

      <div className="treatment-record-layout">
        <TreatmentList
          treatments={visibleTreatments}
          categoriesById={categoriesById}
          onAddFirst={openAddForm}
          onView={setSelectedTreatmentId}
          onEdit={openEditForm}
          onDelete={deleteTreatment}
        />
        <TreatmentDetails
          treatment={selectedTreatment}
          category={selectedTreatment ? categoriesById[selectedTreatment.category] : undefined}
        />
      </div>

      <TreatmentForm
        open={formOpen}
        mode={formMode}
        treatment={editingTreatment}
        categories={treatmentCategories}
        statusOptions={statusOptions}
        onClose={() => setFormOpen(false)}
        onSave={saveTreatment}
      />
    </div>
  );
}

interface Props {
  searchValue: string;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
}

export function PatientEmptyState({ searchValue, onPrimaryAction, primaryActionLabel }: Props) {
  return (
    <div className="clinic-dashboard-empty-state patient-empty-state">
      <strong>{searchValue ? 'No patients found' : 'No patient records yet.'}</strong>
      <p>
        {searchValue
          ? 'Try a different name, patient ID, or contact number, or clear the current filters.'
          : 'The patient module is ready for table and card views once live data is connected.'}
      </p>
      <button type="button" className="btn btn-primary patient-empty-state__action" onClick={onPrimaryAction}>
        {primaryActionLabel}
      </button>
    </div>
  );
}

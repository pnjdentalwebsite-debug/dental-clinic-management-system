interface Props {
  isEdit: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function MasterFileModalFooter({ isEdit, onClose, onSave }: Props) {
  return (
    <div className="master-file-record-modal__footer">
      <div className="master-file-record-modal__footer-actions">
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button
          type="button"
          className="btn btn-primary master-file-record-modal__save"
          onClick={onSave}
        >
          {isEdit ? 'Save Changes' : 'Save Record'}
        </button>
      </div>
    </div>
  );
}

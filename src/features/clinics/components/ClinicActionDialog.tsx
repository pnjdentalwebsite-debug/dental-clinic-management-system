import { useState } from 'react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import type { PlatformUser } from '../../platformManagement/types';
import type { Clinic, ClinicAssignment, ClinicAssignmentRole } from '../types';

export type ClinicDialogAction = 'activate' | 'deactivate' | 'archive' | 'restore' | 'set_primary' | 'assign_dentist' | 'assign_staff' | 'remove_assignment' | 'change_admin' | 'delete_permanent';

interface Props {
  open: boolean;
  action: ClinicDialogAction | null;
  clinic: Clinic | null;
  users: PlatformUser[];
  assignments?: ClinicAssignment[];
  onClose: () => void;
  onSubmit: (payload: Record<string, string | boolean>) => void;
}

const titleFor = (action: ClinicDialogAction, clinic: Clinic) =>
  action === 'assign_dentist' ? `Assign Dentist to ${clinic.name}` :
  action === 'assign_staff' ? `Assign Staff to ${clinic.name}` :
  action === 'remove_assignment' ? `Remove Assignment from ${clinic.name}` :
  action === 'change_admin' ? `Change Administrator for ${clinic.name}` :
  action === 'deactivate' ? `Deactivate ${clinic.name}` :
  action === 'archive' ? `Archive ${clinic.name}` :
  action === 'delete_permanent' ? `Permanently Delete ${clinic.name}` :
  `${action.replace('_', ' ')} ${clinic.name}`;

export function ClinicActionDialog({ open, action, clinic, users, assignments = [], onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [userId, setUserId] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  if (!open || !action || !clinic) return null;

  if (action === 'delete_permanent') {
    return (
      <ConfirmationDialog
        open={open}
        title={`Permanently Delete ${clinic.name}?`}
        description={`Are you sure you want to permanently delete ${clinic.name} (${clinic.clinicNumber})? All local mappings and user assignments will be completely erased. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        destructive
        onCancel={onClose}
        onConfirm={() => onSubmit({})}
      />
    );
  }

  if (['activate', 'restore', 'set_primary'].includes(action)) {
    return (
      <ConfirmationDialog
        open={open}
        title={titleFor(action, clinic)}
        description={action === 'set_primary' ? 'This subscriber can have only one primary clinic. The current primary designation will move.' : action === 'restore' ? 'Restored clinics return as inactive and can be activated after validation.' : 'Activation validates subscriber, subscription, plan limit, and required clinic fields.'}
        confirmLabel={action === 'set_primary' ? 'Set Primary' : action === 'restore' ? 'Restore Clinic' : 'Activate Clinic'}
        onCancel={onClose}
        onConfirm={() => onSubmit({})}
      />
    );
  }

  const eligibleRole: ClinicAssignmentRole = action === 'assign_dentist' ? 'associate' : action === 'assign_staff' ? 'staff' : 'clinic_owner';
  const eligibleUsers = users.filter(user => user.subscriberId === clinic.subscriberId && user.accountStatus === 'active' && user.role === eligibleRole);
  const activeAssignments = assignments.filter(item => item.assignmentStatus === 'active');

  return (
    <Modal
      open={open}
      title={titleFor(action, clinic)}
      description="Mock clinic relationship workflow only. No production permissions are changed."
      onClose={onClose}
      role={['archive', 'deactivate', 'remove_assignment'].includes(action) ? 'alertdialog' : 'dialog'}
      footer={(
        <>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ width: 'auto', backgroundColor: ['archive', 'deactivate', 'remove_assignment'].includes(action) ? 'var(--danger)' : undefined }} onClick={() => onSubmit({ reason, note, userId, assignmentId })}>
            {action === 'archive' ? 'Archive Clinic' : action === 'deactivate' ? 'Deactivate Clinic' : 'Confirm'}
          </button>
        </>
      )}
    >
      {action === 'deactivate' && <div className="banner-alert warning">Deactivating this clinic will make it unavailable for new operational activities in future modules. Existing records will be preserved.</div>}
      {['deactivate', 'archive'].includes(action) && <div className="filter-grid"><label className="filter-control"><span>{action === 'archive' ? 'Archive Reason' : 'Deactivation Reason'}</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label><label className="filter-control"><span>Internal Note</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label></div>}
      {['assign_dentist', 'assign_staff', 'change_admin'].includes(action) && <div className="filter-grid"><label className="filter-control"><span>User</span><select className="form-input" value={userId} onChange={event => setUserId(event.target.value)}><option value="">Choose user</option>{eligibleUsers.map(user => <option key={user.id} value={user.id}>{user.fullName} - {user.position}</option>)}</select></label><label className="filter-control"><span>Assignment Note</span><input className="form-input" value={note} onChange={event => setNote(event.target.value)} /></label>{eligibleUsers.length === 0 && <div className="empty-state">No eligible users under this subscriber.</div>}</div>}
      {action === 'remove_assignment' && <div className="filter-grid"><label className="filter-control"><span>Assignment</span><select className="form-input" value={assignmentId} onChange={event => setAssignmentId(event.target.value)}><option value="">Choose assignment</option>{activeAssignments.map(item => <option key={item.id} value={item.id}>{item.assignmentRole.replace('_', ' ')} - {users.find(user => user.id === item.userId)?.fullName || item.userId}</option>)}</select></label><label className="filter-control"><span>Removal Reason</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label></div>}
    </Modal>
  );
}

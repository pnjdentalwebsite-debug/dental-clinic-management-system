import { useState } from 'react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../components/overlays/Modal';
import type { Clinic } from '../../clinics/types';
import type { ClinicLaboratoryConnection, Laboratory, LaboratoryService, LaboratoryServiceCategory } from '../types';

export type LaboratoryDialogAction = 'activate' | 'deactivate' | 'archive' | 'restore' | 'connect_clinic' | 'disconnect_clinic' | 'set_preferred' | 'add_service' | 'edit_service' | 'activate_service' | 'deactivate_service' | 'archive_service' | 'restore_service' | 'delete_permanent';

interface Props {
  open: boolean;
  action: LaboratoryDialogAction | null;
  laboratory: Laboratory | null;
  clinics?: Clinic[];
  connections?: ClinicLaboratoryConnection[];
  services?: LaboratoryService[];
  selectedConnection?: ClinicLaboratoryConnection | null;
  selectedService?: LaboratoryService | null;
  onClose: () => void;
  onSubmit: (payload: Record<string, string | boolean | number | string[]>) => void;
}

const categories: LaboratoryServiceCategory[] = ['crowns_and_bridges', 'dentures', 'orthodontics', 'implants', 'veneers', 'retainers', 'night_guards', 'repairs', 'diagnostic_models', 'other'];
const format = (value: string) => value.replaceAll('_', ' ');

export function LaboratoryActionDialog({ open, action, laboratory, clinics = [], connections = [], services = [], selectedConnection, selectedService, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [preferred, setPreferred] = useState(false);
  const [allowedServices, setAllowedServices] = useState<string[]>([]);
  const [turnaround, setTurnaround] = useState(laboratory?.defaultTurnaroundDays || 7);
  const [serviceCode, setServiceCode] = useState(selectedService?.serviceCode || '');
  const [serviceName, setServiceName] = useState(selectedService?.name || '');
  const [category, setCategory] = useState<LaboratoryServiceCategory>(selectedService?.category || 'crowns_and_bridges');
  const [description, setDescription] = useState(selectedService?.description || '');
  const [price, setPrice] = useState(selectedService?.defaultPrice === undefined ? '' : String(selectedService.defaultPrice));
  const [rushFee, setRushFee] = useState(selectedService?.rushFee === undefined ? '' : String(selectedService.rushFee));
  const [rushAvailable, setRushAvailable] = useState(selectedService?.rushAvailable ?? true);
  const [serviceTurnaround, setServiceTurnaround] = useState(selectedService?.defaultTurnaroundDays || laboratory?.defaultTurnaroundDays || 7);
  if (!open || !action || !laboratory) return null;

  if (action === 'delete_permanent') {
    return (
      <ConfirmationDialog
        open={open}
        title={`Permanently Delete ${laboratory.name}?`}
        description={`Are you sure you want to permanently delete ${laboratory.name} (${laboratory.laboratoryNumber})? All clinic connections and service catalog entries will be completely removed. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        destructive
        onCancel={onClose}
        onConfirm={() => onSubmit({})}
      />
    );
  }

  if (['activate', 'restore', 'set_preferred', 'activate_service', 'deactivate_service', 'archive_service', 'restore_service'].includes(action)) {
    return (
      <ConfirmationDialog
        open={open}
        title={`${format(action)} ${laboratory.name}`}
        description={action === 'restore' ? 'Restored laboratories return inactive by default. Previous clinic connections remain non-operational until explicitly reconnected.' : action === 'set_preferred' ? 'The current preferred laboratory for this clinic will be replaced.' : 'This updates centralized laboratory records and history.'}
        confirmLabel={action === 'restore' ? 'Restore Laboratory' : action.includes('service') ? 'Confirm Service Action' : action === 'set_preferred' ? 'Set Preferred' : 'Activate Laboratory'}
        destructive={action === 'archive_service'}
        onCancel={onClose}
        onConfirm={() => onSubmit({})}
      />
    );
  }

  const eligibleClinics = clinics.filter(clinic => clinic.subscriberId === laboratory.subscriberId && clinic.status !== 'archived' && !connections.some(item => item.clinicId === clinic.id && item.status === 'active'));
  const toggleService = (id: string) => setAllowedServices(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);

  return (
    <Modal
      open={open}
      title={`${format(action)} ${laboratory.name}`}
      description="Mock laboratory workflow only. No production laboratory orders are created."
      onClose={onClose}
      role={['archive', 'deactivate', 'disconnect_clinic'].includes(action) ? 'alertdialog' : 'dialog'}
      footer={(
        <>
          <button className="btn btn-outline" style={{ width: 'auto' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ width: 'auto', backgroundColor: ['archive', 'deactivate', 'disconnect_clinic'].includes(action) ? 'var(--danger)' : undefined }} onClick={() => onSubmit({ reason, note, clinicId, isPreferred: preferred, servicesAllowed: allowedServices.length ? allowedServices : services.filter(service => service.status === 'active').map(service => service.id), defaultTurnaroundDays: turnaround, serviceCode, name: serviceName, category, description, defaultPrice: price, rushAvailable, rushFee, defaultServiceTurnaroundDays: serviceTurnaround })}>
            {action === 'archive' ? 'Archive Laboratory' : action === 'deactivate' ? 'Deactivate Laboratory' : action === 'disconnect_clinic' ? 'Disconnect Clinic' : 'Confirm'}
          </button>
        </>
      )}
    >
      {action === 'deactivate' && <div className="banner-alert warning">Existing laboratory records and historical clinic connections will be preserved.</div>}
      {action === 'disconnect_clinic' && <div className="banner-alert warning">Historical laboratory activity and records will remain available.</div>}
      {['deactivate', 'archive', 'disconnect_clinic'].includes(action) && <div className="filter-grid"><label className="filter-control"><span>Reason</span><input className="form-input" value={reason} onChange={event => setReason(event.target.value)} /></label><label className="filter-control"><span>Internal Note</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>{selectedConnection && <div className="info-tile"><span>Connection Date</span><strong>{selectedConnection.connectedAt}</strong></div>}</div>}
      {action === 'connect_clinic' && <div className="filter-grid"><label className="filter-control"><span>Clinic</span><select className="form-input" value={clinicId} onChange={event => setClinicId(event.target.value)}><option value="">Choose clinic</option>{eligibleClinics.map(clinic => <option key={clinic.id} value={clinic.id}>{clinic.name} - {clinic.city}</option>)}</select></label><label className="filter-control"><span>Turnaround Override</span><input type="number" min={1} className="form-input" value={turnaround} onChange={event => setTurnaround(Number(event.target.value))} /></label><label className="checkbox-label"><input type="checkbox" checked={preferred} onChange={event => setPreferred(event.target.checked)} /><span>Set as Preferred Laboratory</span></label><label className="filter-control"><span>Notes</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label><div><strong>Allowed Services</strong>{services.filter(service => service.status === 'active').map(service => <label className="checkbox-label" key={service.id}><input type="checkbox" checked={allowedServices.includes(service.id)} onChange={() => toggleService(service.id)} /><span>{service.name}</span></label>)}</div>{eligibleClinics.length === 0 && <div className="empty-state">No eligible unconnected clinics under this subscriber.</div>}</div>}
      {['add_service', 'edit_service'].includes(action) && <div className="filter-grid"><label className="filter-control"><span>Service Code</span><input className="form-input" value={serviceCode} onChange={event => setServiceCode(event.target.value)} /></label><label className="filter-control"><span>Name</span><input className="form-input" value={serviceName} onChange={event => setServiceName(event.target.value)} /></label><label className="filter-control"><span>Category</span><select className="form-input" value={category} onChange={event => setCategory(event.target.value as LaboratoryServiceCategory)}>{categories.map(item => <option key={item} value={item}>{format(item)}</option>)}</select></label><label className="filter-control"><span>Prototype Price</span><input className="form-input" value={price} placeholder="Blank means pending decision" onChange={event => setPrice(event.target.value)} /></label><label className="filter-control"><span>Turnaround Days</span><input type="number" min={1} className="form-input" value={serviceTurnaround} onChange={event => setServiceTurnaround(Number(event.target.value))} /></label><label className="checkbox-label"><input type="checkbox" checked={rushAvailable} onChange={event => setRushAvailable(event.target.checked)} /><span>Rush Available</span></label><label className="filter-control"><span>Rush Fee</span><input className="form-input" value={rushFee} placeholder="Blank means pending decision" onChange={event => setRushFee(event.target.value)} /></label><label className="filter-control"><span>Description</span><textarea className="form-input" rows={3} value={description} onChange={event => setDescription(event.target.value)} /></label></div>}
    </Modal>
  );
}

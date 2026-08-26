import { useEffect, useState } from 'react';
import type { Clinic } from '../../clinics/types';
import type { Subscriber } from '../../platformManagement/types';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import type { Laboratory, LaboratoryFormData, LaboratoryServiceCategory, LaboratoryType } from '../types';

interface Props {
  mode: 'create' | 'edit';
  laboratory?: Laboratory;
  subscribers: Subscriber[];
  clinics: Clinic[];
  saving?: boolean;
  onCancel: () => void;
  onSave: (data: LaboratoryFormData, draft?: boolean, allowPendingOverride?: boolean) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const categories: LaboratoryServiceCategory[] = ['crowns_and_bridges', 'dentures', 'orthodontics', 'implants', 'veneers', 'retainers', 'night_guards', 'repairs', 'diagnostic_models', 'other'];
const types: LaboratoryType[] = ['internal', 'external', 'partner', 'independent'];
const format = (value: string) => value.replaceAll('_', ' ');

export function LaboratoryForm({ mode, laboratory, subscribers, clinics, saving = false, onCancel, onSave }: Props) {
  const [data, setData] = useState<LaboratoryFormData>(mockLaboratoryService.toFormData(laboratory));
  const [allowPendingOverride, setAllowPendingOverride] = useState(false);
  const selectedSubscriber = subscribers.find(item => item.id === data.subscriberId);
  const eligibleClinics = clinics.filter(item => item.subscriberId === data.subscriberId && item.status !== 'archived');
  const limit = data.subscriberId ? mockLaboratoryService.validateLaboratoryLimit(data.subscriberId, laboratory?.id, allowPendingOverride) : null;

  useEffect(() => {
    if (mode === 'edit' || !selectedSubscriber) return;
    setData(prev => ({
      ...prev,
      legalBusinessName: prev.legalBusinessName || selectedSubscriber.businessName,
      email: prev.email || selectedSubscriber.email.replace('@', '+lab@'),
      contactNumber: prev.contactNumber || selectedSubscriber.mobileNumber
    }));
  }, [mode, selectedSubscriber]);

  useEffect(() => {
    if (mode !== 'create' || data.subscriberId || subscribers.length !== 1) return;
    setData(prev => ({
      ...prev,
      subscriberId: subscribers[0].id
    }));
  }, [data.subscriberId, mode, subscribers]);

  const setField = <K extends keyof LaboratoryFormData>(key: K, value: LaboratoryFormData[K]) => setData(prev => ({ ...prev, [key]: value }));
  const setHour = (day: string, key: string, value: string | boolean) => setData(prev => ({ ...prev, businessHours: { ...prev.businessHours, [day]: { ...prev.businessHours[day], [key]: value } } }));
  const toggleClinic = (clinicId: string) => setData(prev => ({ ...prev, initialClinicIds: prev.initialClinicIds.includes(clinicId) ? prev.initialClinicIds.filter(id => id !== clinicId) : [...prev.initialClinicIds, clinicId] }));
  const addService = () => setData(prev => ({ ...prev, initialServices: [...prev.initialServices, { serviceCode: '', name: '', category: 'crowns_and_bridges', description: '', defaultPrice: '', defaultTurnaroundDays: prev.defaultTurnaroundDays, rushAvailable: prev.acceptsRushOrders, rushAdditionalDays: 2, rushFee: '', status: 'active' }] }));
  const updateService = (index: number, patch: Partial<LaboratoryFormData['initialServices'][number]>) => setData(prev => ({ ...prev, initialServices: prev.initialServices.map((item, idx) => idx === index ? { ...item, ...patch } : item) }));
  const removeService = (index: number) => setData(prev => ({ ...prev, initialServices: prev.initialServices.filter((_, idx) => idx !== index) }));

  return (
    <form className="plan-form" onSubmit={event => { event.preventDefault(); onSave(data, false, allowPendingOverride); }}>
      <section className="dashboard-panel">
        <h2>Ownership</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Subscriber</span><select className="form-input" value={data.subscriberId} disabled={mode === 'edit'} onChange={event => setField('subscriberId', event.target.value)}><option value="">Choose subscriber</option>{subscribers.map(item => <option key={item.id} value={item.id}>{item.businessName} - {item.accountStatus}</option>)}</select></label>
          <label className="filter-control"><span>Laboratory Type</span><select className="form-input" value={data.laboratoryType} onChange={event => setField('laboratoryType', event.target.value as LaboratoryType)}>{types.map(item => <option key={item} value={item}>{format(item)}</option>)}</select></label>
          {limit && <div className={`banner-alert ${limit.valid ? 'info' : 'warning'}`}>Laboratory limit: {limit.limitValue} | usage {limit.usage} | remaining {String(limit.remaining)}{limit.warning ? ` | ${limit.warning}` : ''}</div>}
          {limit?.limitValue === 'pending' && <label className="checkbox-label"><input type="checkbox" checked={allowPendingOverride} onChange={event => setAllowPendingOverride(event.target.checked)} /><span>Use prototype override for pending plan limit</span></label>}
        </div>
        {mode === 'create' && <div style={{ marginTop: '1rem' }}><h3>Initial Clinic Connections</h3>{eligibleClinics.length ? eligibleClinics.map(clinic => <label className="checkbox-label" key={clinic.id}><input type="checkbox" checked={data.initialClinicIds.includes(clinic.id)} onChange={() => toggleClinic(clinic.id)} /><span>{clinic.name} - {clinic.city}</span></label>) : <div className="empty-state">Choose a subscriber to see eligible clinics.</div>}</div>}
      </section>

      <section className="dashboard-panel">
        <h2>Laboratory Information</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Laboratory Name</span><input className="form-input" value={data.name} onChange={event => setField('name', event.target.value)} /></label>
          <label className="filter-control"><span>Legal Business Name</span><input className="form-input" value={data.legalBusinessName} onChange={event => setField('legalBusinessName', event.target.value)} /></label>
          <label className="filter-control"><span>Email</span><input className="form-input" value={data.email} onChange={event => setField('email', event.target.value)} /></label>
          <label className="filter-control"><span>Contact Number</span><input className="form-input" value={data.contactNumber} onChange={event => setField('contactNumber', event.target.value)} /></label>
          <label className="filter-control"><span>Alternative Contact</span><input className="form-input" value={data.alternativeContactNumber} onChange={event => setField('alternativeContactNumber', event.target.value)} /></label>
          <label className="filter-control"><span>Contact Person</span><input className="form-input" value={data.contactPersonName} onChange={event => setField('contactPersonName', event.target.value)} /></label>
          <label className="filter-control"><span>Contact Person Position</span><input className="form-input" value={data.contactPersonPosition} onChange={event => setField('contactPersonPosition', event.target.value)} /></label>
          <label className="filter-control"><span>Visibility</span><select className="form-input" value={data.visibility} onChange={event => setField('visibility', event.target.value as LaboratoryFormData['visibility'])}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
          <label className="filter-control"><span>Logo Mock File</span><input className="form-input" value={data.logoFileName} onChange={event => setField('logoFileName', event.target.value)} /></label>
          <label className="filter-control"><span>Logo Mock Type</span><input className="form-input" value={data.logoFileType} onChange={event => setField('logoFileType', event.target.value)} /></label>
        </div>
        <label className="filter-control" style={{ marginTop: '1rem' }}><span>Description</span><textarea className="form-input" rows={3} value={data.description} onChange={event => setField('description', event.target.value)} /></label>
      </section>

      <section className="dashboard-panel">
        <h2>Location</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Address Line 1</span><input className="form-input" value={data.addressLine1} onChange={event => setField('addressLine1', event.target.value)} /></label>
          <label className="filter-control"><span>Address Line 2</span><input className="form-input" value={data.addressLine2} onChange={event => setField('addressLine2', event.target.value)} /></label>
          <label className="filter-control"><span>Barangay</span><input className="form-input" value={data.barangay} onChange={event => setField('barangay', event.target.value)} /></label>
          <label className="filter-control"><span>City</span><input className="form-input" value={data.city} onChange={event => setField('city', event.target.value)} /></label>
          <label className="filter-control"><span>Province</span><input className="form-input" value={data.province} onChange={event => setField('province', event.target.value)} /></label>
          <label className="filter-control"><span>Postal Code</span><input className="form-input" value={data.postalCode} onChange={event => setField('postalCode', event.target.value)} /></label>
          <label className="filter-control"><span>Country</span><input className="form-input" value={data.country} onChange={event => setField('country', event.target.value)} /></label>
          <label className="filter-control"><span>Timezone</span><input className="form-input" value={data.timezone} onChange={event => setField('timezone', event.target.value)} /></label>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Operations</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Default Turnaround Days</span><input type="number" min={1} className="form-input" value={data.defaultTurnaroundDays} onChange={event => setField('defaultTurnaroundDays', Number(event.target.value))} /></label>
          <label className="filter-control"><span>Rush Turnaround Days</span><input type="number" min={1} className="form-input" value={data.rushTurnaroundDays} onChange={event => setField('rushTurnaroundDays', Number(event.target.value))} /></label>
          <label className="checkbox-label"><input type="checkbox" checked={data.acceptsRushOrders} onChange={event => setField('acceptsRushOrders', event.target.checked)} /><span>Accepts Rush Orders</span></label>
          <label className="filter-control"><span>Service Area</span><input className="form-input" value={data.serviceArea} onChange={event => setField('serviceArea', event.target.value)} /></label>
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Business Hours</h2>
        <div className="table-container"><table className="data-table"><thead><tr><th>Day</th><th>Open</th><th>Opening</th><th>Closing</th><th>Break</th><th>Break Start</th><th>Break End</th></tr></thead><tbody>{days.map(day => { const value = data.businessHours[day]; return <tr key={day}><td>{day}</td><td><input type="checkbox" checked={value.enabled} onChange={event => setHour(day, 'enabled', event.target.checked)} /></td><td><input className="form-input" type="time" value={value.openingTime} disabled={!value.enabled} onChange={event => setHour(day, 'openingTime', event.target.value)} /></td><td><input className="form-input" type="time" value={value.closingTime} disabled={!value.enabled} onChange={event => setHour(day, 'closingTime', event.target.value)} /></td><td><input type="checkbox" checked={value.breakEnabled} disabled={!value.enabled} onChange={event => setHour(day, 'breakEnabled', event.target.checked)} /></td><td><input className="form-input" type="time" value={value.breakStart} disabled={!value.enabled || !value.breakEnabled} onChange={event => setHour(day, 'breakStart', event.target.value)} /></td><td><input className="form-input" type="time" value={value.breakEnd} disabled={!value.enabled || !value.breakEnabled} onChange={event => setHour(day, 'breakEnd', event.target.value)} /></td></tr>; })}</tbody></table></div>
      </section>

      {mode === 'create' && <section className="dashboard-panel"><div className="toolbar-row"><h2>Initial Services</h2><button type="button" className="btn btn-outline compact-action" onClick={addService}>Add Service</button></div>{data.initialServices.length === 0 ? <div className="empty-state">No initial services. Services can also be added after creation.</div> : data.initialServices.map((service, index) => <div className="filter-grid" key={index} style={{ marginBottom: '1rem' }}><label className="filter-control"><span>Service Code</span><input className="form-input" value={service.serviceCode} onChange={event => updateService(index, { serviceCode: event.target.value })} /></label><label className="filter-control"><span>Name</span><input className="form-input" value={service.name} onChange={event => updateService(index, { name: event.target.value })} /></label><label className="filter-control"><span>Category</span><select className="form-input" value={service.category} onChange={event => updateService(index, { category: event.target.value as LaboratoryServiceCategory })}>{categories.map(item => <option key={item} value={item}>{format(item)}</option>)}</select></label><label className="filter-control"><span>Prototype Price</span><input className="form-input" value={service.defaultPrice} onChange={event => updateService(index, { defaultPrice: event.target.value })} /></label><label className="filter-control"><span>Turnaround Days</span><input type="number" min={1} className="form-input" value={service.defaultTurnaroundDays} onChange={event => updateService(index, { defaultTurnaroundDays: Number(event.target.value) })} /></label><button type="button" className="btn btn-outline compact-action" onClick={() => removeService(index)}>Remove</button></div>)}</section>}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel} disabled={saving}>Cancel</button>
        {mode === 'create' && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => onSave(data, true, allowPendingOverride)} disabled={saving}>Save as Draft</button>}
        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>{mode === 'create' ? 'Create Laboratory' : 'Save Changes'}</button>
      </div>
    </form>
  );
}

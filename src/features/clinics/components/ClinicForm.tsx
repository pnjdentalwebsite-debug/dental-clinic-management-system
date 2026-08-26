import { useEffect, useState } from 'react';
import type { PlatformUser, Subscriber } from '../../platformManagement/types';
import type { Clinic, ClinicFormData } from '../types';
import { mockClinicService } from '../services/mockClinicService';

interface Props {
  mode: 'create' | 'edit';
  clinic?: Clinic;
  subscribers: Subscriber[];
  users: PlatformUser[];
  saving?: boolean;
  onCancel: () => void;
  onSave: (data: ClinicFormData, draft?: boolean, allowPendingOverride?: boolean) => void;
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function ClinicForm({ mode, clinic, subscribers, users, saving = false, onCancel, onSave }: Props) {
  const [data, setData] = useState<ClinicFormData>(mockClinicService.toFormData(clinic));
  const [allowPendingOverride, setAllowPendingOverride] = useState(false);
  const selectedSubscriber = subscribers.find(item => item.id === data.subscriberId);
  const eligibleOwners = users.filter(item => item.subscriberId === data.subscriberId && item.role === 'clinic_owner' && item.accountStatus === 'active');
  const eligibleDentists = users.filter(item => item.subscriberId === data.subscriberId && item.role === 'associate' && item.accountStatus === 'active');
  const eligibleStaff = users.filter(item => item.subscriberId === data.subscriberId && item.role === 'staff' && item.accountStatus === 'active');
  const limit = data.subscriberId ? mockClinicService.validateClinicLimit(data.subscriberId, clinic?.id, allowPendingOverride) : null;

  useEffect(() => {
    if (mode === 'edit' || !selectedSubscriber) return;
    setData(prev => ({
      ...prev,
      legalBusinessName: prev.legalBusinessName || selectedSubscriber.businessName,
      email: prev.email || selectedSubscriber.email.replace('owner', 'clinic'),
      contactNumber: prev.contactNumber || selectedSubscriber.mobileNumber,
      primaryOwnerUserId: prev.primaryOwnerUserId || eligibleOwners[0]?.id || ''
    }));
  }, [eligibleOwners, mode, selectedSubscriber]);

  const setField = <K extends keyof ClinicFormData>(key: K, value: ClinicFormData[K]) => setData(prev => ({ ...prev, [key]: value }));
  const toggleUser = (key: 'dentistUserIds' | 'staffUserIds', userId: string) => setData(prev => ({ ...prev, [key]: prev[key].includes(userId) ? prev[key].filter(id => id !== userId) : [...prev[key], userId] }));
  const setHour = (day: string, key: string, value: string | boolean) => setData(prev => ({ ...prev, businessHours: { ...prev.businessHours, [day]: { ...prev.businessHours[day], [key]: value } } }));

  return (
    <form className="plan-form" onSubmit={event => { event.preventDefault(); onSave(data, false, allowPendingOverride); }}>
      <section className="dashboard-panel">
        <h2>Subscriber Ownership</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Subscriber</span><select className="form-input" value={data.subscriberId} disabled={mode === 'edit'} onChange={event => setField('subscriberId', event.target.value)}><option value="">Choose subscriber</option>{subscribers.map(item => <option key={item.id} value={item.id}>{item.businessName} - {item.accountStatus}</option>)}</select></label>
          <label className="filter-control"><span>Primary Administrator</span><select className="form-input" value={data.primaryOwnerUserId} disabled={mode === 'edit'} onChange={event => setField('primaryOwnerUserId', event.target.value)}><option value="">Choose administrator</option>{eligibleOwners.map(item => <option key={item.id} value={item.id}>{item.fullName}</option>)}</select></label>
          <label className="checkbox-label"><input type="checkbox" checked={data.isPrimaryClinic} disabled={mode === 'edit'} onChange={event => setField('isPrimaryClinic', event.target.checked)} /><span>Set as Primary Clinic</span></label>
          {limit && <div className={`banner-alert ${limit.valid ? 'info' : 'warning'}`}>Clinic limit: {limit.limitValue} | usage {limit.usage} | remaining {String(limit.remaining)}{limit.warning ? ` | ${limit.warning}` : ''}</div>}
          {limit?.limitValue === 'pending' && <label className="checkbox-label"><input type="checkbox" checked={allowPendingOverride} onChange={event => setAllowPendingOverride(event.target.checked)} /><span>Use prototype override for pending plan limit</span></label>}
        </div>
      </section>

      <section className="dashboard-panel">
        <h2>Clinic Information</h2>
        <div className="filter-grid">
          <label className="filter-control"><span>Clinic Name</span><input className="form-input" value={data.name} onChange={event => setField('name', event.target.value)} /></label>
          <label className="filter-control"><span>Legal Business Name</span><input className="form-input" value={data.legalBusinessName} onChange={event => setField('legalBusinessName', event.target.value)} /></label>
          <label className="filter-control"><span>Email</span><input className="form-input" value={data.email} onChange={event => setField('email', event.target.value)} /></label>
          <label className="filter-control"><span>Contact Number</span><input className="form-input" value={data.contactNumber} onChange={event => setField('contactNumber', event.target.value)} /></label>
          <label className="filter-control"><span>Alternative Contact</span><input className="form-input" value={data.alternativeContactNumber} onChange={event => setField('alternativeContactNumber', event.target.value)} /></label>
          <label className="filter-control"><span>Visibility</span><select className="form-input" value={data.visibility} onChange={event => setField('visibility', event.target.value as ClinicFormData['visibility'])}><option value="visible">Visible</option><option value="hidden">Hidden</option></select></label>
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
        <h2>Business Hours</h2>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Day</th><th>Open</th><th>Opening</th><th>Closing</th><th>Break</th><th>Break Start</th><th>Break End</th></tr></thead>
            <tbody>{days.map(day => {
              const value = data.businessHours[day];
              return <tr key={day}><td>{day}</td><td><input type="checkbox" checked={value.enabled} onChange={event => setHour(day, 'enabled', event.target.checked)} /></td><td><input className="form-input" type="time" value={value.openingTime} disabled={!value.enabled} onChange={event => setHour(day, 'openingTime', event.target.value)} /></td><td><input className="form-input" type="time" value={value.closingTime} disabled={!value.enabled} onChange={event => setHour(day, 'closingTime', event.target.value)} /></td><td><input type="checkbox" checked={value.breakEnabled} disabled={!value.enabled} onChange={event => setHour(day, 'breakEnabled', event.target.checked)} /></td><td><input className="form-input" type="time" value={value.breakStart} disabled={!value.enabled || !value.breakEnabled} onChange={event => setHour(day, 'breakStart', event.target.value)} /></td><td><input className="form-input" type="time" value={value.breakEnd} disabled={!value.enabled || !value.breakEnabled} onChange={event => setHour(day, 'breakEnd', event.target.value)} /></td></tr>;
            })}</tbody>
          </table>
        </div>
      </section>

      {mode === 'create' && (
        <section className="dashboard-panel">
          <h2>Initial Assignments</h2>
          <div className="sections-grid">
            <div><h3>Associate Dentists</h3>{eligibleDentists.length ? eligibleDentists.map(user => <label className="checkbox-label" key={user.id}><input type="checkbox" checked={data.dentistUserIds.includes(user.id)} onChange={() => toggleUser('dentistUserIds', user.id)} /><span>{user.fullName}</span></label>) : <div className="empty-state">No eligible dentists.</div>}</div>
            <div><h3>Staff Members</h3>{eligibleStaff.length ? eligibleStaff.map(user => <label className="checkbox-label" key={user.id}><input type="checkbox" checked={data.staffUserIds.includes(user.id)} onChange={() => toggleUser('staffUserIds', user.id)} /><span>{user.fullName}</span></label>) : <div className="empty-state">No eligible staff.</div>}</div>
          </div>
        </section>
      )}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={onCancel} disabled={saving}>Cancel</button>
        {mode === 'create' && <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => onSave(data, true, allowPendingOverride)} disabled={saving}>Save as Draft</button>}
        <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>{mode === 'create' ? 'Create Clinic' : 'Save Changes'}</button>
      </div>
    </form>
  );
}

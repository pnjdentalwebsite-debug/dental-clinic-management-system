import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarDays, ChevronRight, ShieldCheck, Stethoscope, Users, Pencil, Save, X } from 'lucide-react';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockStaffService } from '../../clinic-owner/services/mockStaffService';
import { mockAssociateDentistService } from '../../clinic-owner/services/mockAssociateDentistService';
import { roleAccountProvisioningService } from '../../clinic-owner/services/roleAccountProvisioningService';
import { getClinicScheduleItems, getLocalDateKey, CLINIC_SCHEDULES_UPDATED_EVENT } from '../scheduling/scheduleStorage';

interface Props {
  role: 'associate' | 'staff';
  name: string;
  email: string;
  clinicIds: string[];
  onOpenClinic: (clinicId: string) => void;
  linkedRecordId?: string;
  clinicName: string;
  planName: string;
  currentRoute: string;
}

export function RoleWorkspacePage({ role, name, email, clinicIds, onOpenClinic, linkedRecordId, clinicName, planName, currentRoute }: Props) {
  const clinics = clinicIds.map((clinicId) => mockClinicService.getClinicById(clinicId)).filter((clinic): clinic is NonNullable<typeof clinic> => Boolean(clinic && clinic.status === 'active'));
  const record = role === 'associate'
    ? mockAssociateDentistService.listDentists().find((item) => item.id === linkedRecordId)
    : mockStaffService.listStaff().find((item) => item.id === linkedRecordId);
  const isRecordActive = Boolean(record && record.status === 'active');
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey());
  const [scheduleVersion, setScheduleVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setScheduleVersion((value) => value + 1);
    window.addEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const scheduledItems = useMemo(() => clinicIds.flatMap((clinicId) => getClinicScheduleItems([], clinicId).filter((item) => item.date === selectedDate)), [clinicIds, selectedDate, scheduleVersion]);
  const title = role === 'associate' ? 'Associate Workspace' : 'Staff Workspace';
  const description = role === 'associate' ? 'Access your assigned clinic branches, schedule, and clinical workspace.' : 'Access your assigned clinic branches, tasks, and operational workspace.';
  const isAssociate = role === 'associate';
  const activeSection = currentRoute.split('#')[1] || 'dashboard';
  const showDashboard = activeSection === 'dashboard';
  const showSchedule = activeSection === 'schedule';
  const showProfile = activeSection === 'profile';
  const showClinics = activeSection === 'clinics';
  const showClinicalWork = isAssociate && activeSection === 'clinical-work';
  const roleLabel = isAssociate ? 'Associate Dentist' : 'Clinic Staff';
  const roleIcon = isAssociate ? Stethoscope : Users;
  const RoleIcon = roleIcon;
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ firstName: record?.firstName || '', lastName: record?.lastName || '', middleName: record?.middleName || '', mobileNumber: record?.mobileNumber || '', address: record?.address || '', email: record?.email || '' });
  const [profileMessage, setProfileMessage] = useState('');
  useEffect(() => { if (record) setProfileDraft({ firstName: record.firstName, lastName: record.lastName, middleName: record.middleName || '', mobileNumber: record.mobileNumber, address: record.address || '', email: record.email || '' }); }, [record?.id, record?.updatedAt]);
  const saveProfile = () => {
    if (!record) return;
    const result = role === 'associate'
      ? mockAssociateDentistService.updateDentist(record.id, profileDraft, email)
      : mockStaffService.updateStaff(record.id, profileDraft);
    if (!result.ok) { setProfileMessage(result.error || 'Unable to save profile.'); return; }
    roleAccountProvisioningService.sync({ role, recordId: record.id, email: profileDraft.email, name: `${profileDraft.firstName} ${profileDraft.lastName}`, subscriberId: record.subscriberId, clinicNames: record.authorizedClinics, status: record.status, privileges: record.privileges as unknown as Record<string, boolean> });
    setEditingProfile(false); setProfileMessage('Profile updated successfully.');
  };
  return <div className={`role-workspace role-workspace--${role}`}>
    <div className="role-workspace__console-context" aria-label="Current console context"><span>{clinicName || 'Clinic Console'}</span><span>{planName || 'Active subscription'}</span></div>
    <main className="role-workspace__main">
      <header className="role-workspace__hero">
        <div className="role-workspace__hero-copy">
          <span className="role-workspace__eyebrow">{isAssociate ? 'ASSOCIATE DENTIST' : 'STAFF MEMBER'}</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="role-workspace__hero-actions">
          <span className="role-workspace__status"><span /> Account active</span>
        </div>
      </header>

      {showDashboard && <section className="role-workspace__welcome">
        <div className="role-workspace__welcome-icon"><RoleIcon size={22} /></div>
        <div><span className="role-workspace__kicker">SIGNED IN AS</span><h2>{name || roleLabel}</h2><p>{email}</p></div>
        <ShieldCheck className="role-workspace__trust" size={25} />
      </section>}

      {showDashboard && <section className="role-workspace__metrics" aria-label="Workspace summary">
        <article className="role-workspace__metric"><Building2 size={18} /><strong>{clinics.length}</strong><span>Assigned clinics</span></article>
        <article className="role-workspace__metric"><CalendarDays size={18} /><strong>{scheduledItems.length}</strong><span>{isAssociate ? 'Today\'s clinical items' : 'Today\'s schedule items'}</span></article>
        <article className="role-workspace__metric"><ShieldCheck size={18} /><strong className={isRecordActive ? 'is-positive' : 'is-warning'}>{isRecordActive ? 'Ready' : 'Restricted'}</strong><span>Workspace access</span></article>
      </section>}

      {(showDashboard || showSchedule || showProfile || showClinicalWork) && <div className="role-workspace__grid">
        {(showDashboard || showSchedule || showClinicalWork) && <section id="schedule" className="role-workspace__panel role-workspace__panel--schedule">
          <div className="role-workspace__panel-head"><div><span className="role-workspace__kicker">{isAssociate ? 'CLINICAL WORK' : 'OPERATIONS'}</span><h2>{isAssociate ? 'My Clinical Schedule' : 'My Schedule & Tasks'}</h2><p>Live items from your assigned clinic access.</p></div><input aria-label="Schedule date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} /></div>
          {scheduledItems.length === 0 ? <div className="role-workspace__empty"><CalendarDays size={22} /><strong>No schedule items for this date</strong><span>Assigned appointments will appear here when available.</span></div> : <div className="role-workspace__schedule-list">{scheduledItems.map((item) => <article className="role-workspace__schedule-item" key={`${item.clinicId}-${item.id}`}><span className="role-workspace__schedule-time">{item.startTime || item.time || 'Time not specified'}</span><div><strong>{item.title || item.procedure || 'Scheduled item'}</strong><span>{item.patientName || 'Patient'} · {item.clinicId}</span></div></article>)}</div>}
        </section>}

        {(showDashboard || showProfile) && <section id="profile" className="role-workspace__panel role-workspace__panel--profile"><div className="role-workspace__panel-head"><div><span className="role-workspace__kicker">ACCOUNT</span><h2>My Profile</h2><p>Update your personal contact details. Access and clinic assignments remain owner-controlled.</p></div>{record && <button className="btn btn-outline" onClick={() => { setEditingProfile((value) => !value); setProfileMessage(''); }}>{editingProfile ? <><X size={14} /> Cancel</> : <><Pencil size={14} /> Edit Profile</>}</button>}</div>{!record ? <div className="role-workspace__empty"><ShieldCheck size={22} /><strong>Profile unavailable</strong><span>Contact the clinic owner to restore the linked record.</span></div> : editingProfile ? <div className="role-profile-form"><label>First Name<input value={profileDraft.firstName} onChange={(event) => setProfileDraft({ ...profileDraft, firstName: event.target.value })} /></label><label>Last Name<input value={profileDraft.lastName} onChange={(event) => setProfileDraft({ ...profileDraft, lastName: event.target.value })} /></label><label>Middle Name<input value={profileDraft.middleName} onChange={(event) => setProfileDraft({ ...profileDraft, middleName: event.target.value })} /></label><label>Mobile Number<input value={profileDraft.mobileNumber} onChange={(event) => setProfileDraft({ ...profileDraft, mobileNumber: event.target.value })} /></label><label>Address<input value={profileDraft.address} onChange={(event) => setProfileDraft({ ...profileDraft, address: event.target.value })} /></label><label>Email Address<input type="email" value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} /></label><div className="role-profile-form__actions"><button className="btn btn-primary" onClick={saveProfile}><Save size={14} /> Save Changes</button></div>{profileMessage && <p className="role-profile-form__message">{profileMessage}</p>}</div> : <div className="role-workspace__profile-list"><div><span>Role</span><strong>{roleLabel}</strong></div><div><span>Account status</span><strong className="is-positive">{record.status}</strong></div><div><span>Clinic access</span><strong>{record.authorizedClinics.length} assigned</strong></div><div><span>Email</span><strong>{record.email || email}</strong></div><div><span>Mobile</span><strong>{record.mobileNumber || 'Not provided'}</strong></div><div><span>Address</span><strong>{record.address || 'Not provided'}</strong></div></div>}</section>}
      </div>}

      {(showDashboard || showClinics) && <section id="clinics" className="role-workspace__panel role-workspace__clinics"><div className="role-workspace__panel-head"><div><span className="role-workspace__kicker">BRANCH ACCESS</span><h2>My Assigned Clinics</h2><p>Only branches assigned by the clinic owner are available here.</p></div><span className="role-workspace__count">{clinics.length} available</span></div>{clinics.length === 0 ? <div className="role-workspace__empty"><Building2 size={22} /><strong>No active clinic assignment</strong><span>Ask the clinic owner to assign an active branch.</span></div> : <div className="role-workspace__clinic-list">{clinics.map((clinic) => <article className="role-workspace__clinic-card" key={clinic.id}><div className="role-workspace__clinic-mark"><Building2 size={19} /></div><div className="role-workspace__clinic-copy"><span>{clinic.id}</span><h3>{clinic.name}</h3><p>{[clinic.city, clinic.province].filter(Boolean).join(', ') || 'Clinic location unavailable'}</p><small><span /> Active branch</small></div><button className="btn btn-primary" onClick={() => onOpenClinic(clinic.id)}>Open Clinic Workspace <ChevronRight size={16} /></button></article>)}</div>}</section>}
    </main>
  </div>;
}

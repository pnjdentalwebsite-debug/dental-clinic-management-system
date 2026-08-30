import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import { platformAdminClinicService as mockClinicService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { ClinicActionDialog, type ClinicDialogAction } from '../components/ClinicActionDialog';
import { ClinicActionMenu } from '../components/ClinicActionMenu';

interface Props {
  clinicId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

const tabs = ['Overview', 'Dentists', 'Staff', 'Laboratories', 'Business Hours', 'Subscription and Plan', 'Activity', 'Change History'];
const format = (value: string) => value.replaceAll('_', ' ');
const Status = ({ status }: { status: string }) => <span className={`status-badge ${status}`}>{format(status)}</span>;

export function ClinicDetailsPage({ clinicId, navigate, showToast, refreshShell }: Props) {
  const showReadOnlyNotice = () => showToast('Clinic editing is unavailable until an approved secure mutation contract is deployed.', 'info');
  usePlatformAdminDetail('clinics', clinicId);
  const [activeTab, setActiveTab] = useState('Overview');
  const [action, setAction] = useState<ClinicDialogAction | null>(null);
  const [, setVersion] = useState(0);
  const clinic = mockClinicService.getClinicById(clinicId);

  if (!clinic) return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/clinics')}><ArrowLeft size={16} /> Back to Clinics</button><div className="dashboard-panel empty-state" style={{ marginTop: '1rem' }}><h1>Clinic not found</h1><p>This clinic record does not exist.</p></div></main>;

  const subscriber = { id: clinic.subscriberId, businessName: clinic.subscriberName || 'Subscriber unavailable' };
  const users = (clinic.detailPersonnel ?? []).map(user => ({ ...user, userNumber: user.id, subscriberId: clinic.subscriberId, clinicIds: [clinic.id], firstName: '', lastName: '', mustChangePassword: false, registeredAt: clinic.createdAt, createdAt: clinic.createdAt, updatedAt: clinic.updatedAt }));
  const assignments = mockClinicService.getClinicAssignments(clinic.id);
  const activeAssignments = assignments.filter(item => item.assignmentStatus === 'active');
  const dentists = users.filter(user => user.role === 'associate');
  const staff = users.filter(user => user.role === 'staff');
  const subscription = clinic.subscriptionSummary ? { ...clinic.subscriptionSummary, subscriptionNumber: clinic.subscriptionSummary.id } : null;
  const plan = subscription ? { name: subscription.planName || subscription.planCode || subscription.planId } : null;
  const history = mockClinicService.getClinicHistory(clinic.id);
  const activity: Array<{ id: string; event: string; timestamp: string; details: string }> = [];

  const submitAction = (payload: Record<string, string | boolean>) => {
    const result =
      action === 'activate' ? mockClinicService.activateClinic(clinic.id) :
      action === 'deactivate' ? mockClinicService.deactivateClinic(clinic.id, String(payload.reason || '')) :
      action === 'archive' ? mockClinicService.archiveClinic(clinic.id, String(payload.reason || '')) :
      action === 'restore' ? mockClinicService.restoreClinic(clinic.id, true) :
      action === 'set_primary' ? mockClinicService.setPrimaryClinic(clinic.id) :
      action === 'assign_dentist' ? mockClinicService.assignUserToClinic(clinic.id, String(payload.userId || ''), 'associate', String(payload.note || '')) :
      action === 'assign_staff' ? mockClinicService.assignUserToClinic(clinic.id, String(payload.userId || ''), 'staff', String(payload.note || '')) :
      action === 'change_admin' ? mockClinicService.changePrimaryAdministrator(clinic.id, String(payload.userId || ''), String(payload.note || '')) :
      mockClinicService.removeUserFromClinic(String(payload.assignmentId || ''), String(payload.reason || ''));
    if (result.ok) {
      showToast(`Clinic ${String(action).replace('_', ' ')} completed.`, 'success');
      setAction(null);
      setVersion(prev => prev + 1);
      refreshShell();
    } else showToast(result.error || 'Clinic action failed.', 'error');
  };

  const menu = <ClinicActionMenu clinic={clinic} onEdit={showReadOnlyNotice} onViewSubscriber={() => navigate(`/platform/subscribers/${clinic.subscriberId}`)} onManageUsers={() => setActiveTab('Dentists')} onViewLabs={() => setActiveTab('Laboratories')} onActivate={() => setAction('activate')} onDeactivate={() => setAction('deactivate')} onSetPrimary={() => setAction('set_primary')} onRestore={() => setAction('restore')} onArchive={() => setAction('archive')} />;

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/platform/clinics')}><ArrowLeft size={16} /> Back to Clinics</button>
      <div className="page-header-container">
        <div><span className="metric-card-label">{clinic.clinicNumber}</span><h1>{clinic.name}</h1><p className="page-title-desc">{subscriber.businessName} - {clinic.ownerDisplayName || 'Owner identity unavailable'} - {clinic.city}, {clinic.province}</p><div className="badge-row"><Status status={clinic.status} />{clinic.isPrimaryClinic && <span className="badge-prototype">Primary Clinic</span>}<span className="status-badge info">{clinic.visibility}</span></div></div>
        {menu}
      </div>
      <div className="summary-grid"><Summary label="Dentists" value={dentists.length} /><Summary label="Staff" value={staff.length} /><Summary label="Assignments" value={activeAssignments.length} /><Summary label="Plan Usage" value="Unavailable" /></div>
      <div className="module-tabs" role="tablist" aria-label="Clinic detail tabs">{tabs.map(tab => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

      {activeTab === 'Overview' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Clinic Name" value={clinic.name} /><Tile label="Legal Business" value={clinic.legalBusinessName} /><Tile label="Email" value={clinic.email} /><Tile label="Contact" value={clinic.contactNumber} /><Tile label="Address" value={`${clinic.addressLine1}, ${clinic.city}, ${clinic.province}`} /><Tile label="Country" value={clinic.country} /><Tile label="Timezone" value={clinic.timezone} /><Tile label="Description" value={clinic.description || 'None'} /><Tile label="Created" value={clinic.createdAt} /><Tile label="Updated" value={clinic.updatedAt} /></div></section>}
      {activeTab === 'Dentists' && <Assignments title="Associate Dentists" users={dentists} role="associate" assignments={activeAssignments} navigate={navigate} onAssign={() => setAction('assign_dentist')} onRemove={() => setAction('remove_assignment')} />}
      {activeTab === 'Staff' && <Assignments title="Staff Members" users={staff} role="staff" assignments={activeAssignments} navigate={navigate} onAssign={() => setAction('assign_staff')} onRemove={() => setAction('remove_assignment')} />}
      {activeTab === 'Laboratories' && <section className="dashboard-panel"><div className="toolbar-row"><h2>Laboratory Connections</h2><button className="btn btn-primary compact-action" onClick={showReadOnlyNotice}>Connect Laboratory</button></div><div className="empty-state">Laboratory connection details are unavailable from the approved clinic detail contract.</div></section>}
      {activeTab === 'Business Hours' && <section className="dashboard-panel"><div className="table-container"><table className="data-table"><thead><tr><th>Day</th><th>Status</th><th>Hours</th><th>Break</th></tr></thead><tbody>{Object.entries(clinic.businessHours).map(([day, hours]) => <tr key={day}><td>{day}</td><td>{hours.enabled ? 'Open' : 'Closed'}</td><td>{hours.enabled ? `${hours.openingTime} - ${hours.closingTime}` : 'Closed'}</td><td>{hours.enabled && hours.breakEnabled ? `${hours.breakStart} - ${hours.breakEnd}` : 'None'}</td></tr>)}</tbody></table></div></section>}
      {activeTab === 'Subscription and Plan' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Subscriber" value={subscriber.businessName} /><Tile label="Subscription" value={subscription?.subscriptionNumber || 'None'} /><Tile label="Subscription Status" value={subscription?.status || 'None'} /><Tile label="Plan" value={plan?.name || subscription?.planId || 'Unknown'} /><Tile label="Clinic Usage Count" value="Unavailable" /><Tile label="Plan Clinic Limit" value="Unavailable" /><Tile label="Remaining Allowance" value="Unavailable" /><Tile label="Limit Status" value="Not included in clinic detail" /></div></section>}
      {activeTab === 'Activity' && <section className="dashboard-panel"><div className="timeline-feed">{activity.length ? activity.map(log => <div className="timeline-item" key={log.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{log.event}</strong><span>{log.timestamp}</span></div><div className="timeline-item-content">{log.details}</div></div>) : <div className="empty-state">No clinic activity recorded.</div>}</div></section>}
      {activeTab === 'Change History' && <section className="dashboard-panel"><div className="timeline-feed">{history.length ? history.map(item => <div className="timeline-item" key={item.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{item.action}</strong><span>{item.createdAt}</span></div><div className="timeline-item-content">{item.details}</div></div>) : <div className="empty-state">No clinic history recorded.</div>}</div></section>}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setAction('change_admin')}>Change Primary Administrator</button></div>
      <ClinicActionDialog open={Boolean(action)} action={action} clinic={clinic} users={users} assignments={assignments} onClose={() => setAction(null)} onSubmit={submitAction} />
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return <div className="summary-card"><span>{label}</span><strong>{value}</strong></div>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return <div className="info-tile"><span>{label}</span><strong>{value}</strong></div>;
}

function Assignments({ title, users, role, assignments, navigate, onAssign, onRemove }: { title: string; users: { id: string; fullName: string; email: string; accountStatus: string; position: string }[]; role: string; assignments: { id: string; userId: string; assignmentRole: string; assignedAt: string }[]; navigate: (route: string) => void; onAssign: () => void; onRemove: () => void }) {
  const rows = assignments.filter(item => item.assignmentRole === role);
  return <section className="dashboard-panel"><div className="toolbar-row"><h2>{title}</h2><button className="btn btn-primary compact-action" onClick={onAssign}>Assign {role === 'associate' ? 'Dentist' : 'Staff'}</button></div>{rows.length === 0 ? <div className="empty-state">No active assignments.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>User</th><th>Email</th><th>Status</th><th>Assigned</th><th>Actions</th></tr></thead><tbody>{rows.map(row => { const user = users.find(item => item.id === row.userId); return <tr key={row.id}><td>{user?.fullName || row.userId}</td><td>{user?.email || 'Unknown'}</td><td>{user?.accountStatus || 'Unknown'}</td><td>{row.assignedAt}</td><td><RowActionMenu ariaLabel={`Actions for ${user?.fullName || row.userId}`} items={[{ id: 'view-user', label: 'View User', onSelect: () => navigate(`/platform/users/${row.userId}`) }, { id: 'remove', label: 'Remove Assignment', destructive: true, onSelect: onRemove }]} /></td></tr>; })}</tbody></table></div>}</section>;
}

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import { Modal } from '../../../components/overlays/Modal';
import { platformAdminClinicService as mockClinicService, platformAdminDirectoryService as mockPlatformManagementService, platformAdminLaboratoryService as mockLaboratoryService, platformAdminPlanService as mockPlanService, platformAdminSubscriptionService as mockSubscriptionService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminDetail } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { LaboratoryActionDialog, type LaboratoryDialogAction } from '../../laboratories/components/LaboratoryActionDialog';
import type { ClinicLaboratoryConnection } from '../../laboratories/types';
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
  const [labAction, setLabAction] = useState<LaboratoryDialogAction | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ClinicLaboratoryConnection | null>(null);
  const [selectedLaboratoryId, setSelectedLaboratoryId] = useState('');
  const [, setVersion] = useState(0);
  const clinic = mockClinicService.getClinicById(clinicId);

  if (!clinic) return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/clinics')}><ArrowLeft size={16} /> Back to Clinics</button><div className="dashboard-panel empty-state" style={{ marginTop: '1rem' }}><h1>Clinic not found</h1><p>This clinic record does not exist.</p></div></main>;

  const subscriber = mockPlatformManagementService.getSubscriberById(clinic.subscriberId);
  const users = mockPlatformManagementService.listUsers();
  const assignments = mockClinicService.getClinicAssignments(clinic.id);
  const laboratoryConnections = mockLaboratoryService.getClinicLaboratories(clinic.id);
  const activeAssignments = assignments.filter(item => item.assignmentStatus === 'active');
  const dentists = mockClinicService.getClinicDentists(clinic.id);
  const staff = mockClinicService.getClinicStaff(clinic.id);
  const subscription = subscriber ? mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id) : null;
  const plan = subscription ? mockPlanService.listPlans().find(item => [item.id, item.name, item.planCode].includes(subscription.planId) || item.id === subscription.priceSnapshot.planId) : null;
  const limit = subscriber ? mockClinicService.validateClinicLimit(subscriber.id, clinic.id, true) : null;
  const history = mockClinicService.getClinicHistory(clinic.id);
  const activity = mockPlatformManagementService.listActivity().filter(log => [clinic.id, clinic.clinicNumber, clinic.name, subscriber?.businessName].some(value => value && log.details.includes(value)));

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
  const openLabAction = (nextAction: LaboratoryDialogAction, connection?: ClinicLaboratoryConnection) => {
    setSelectedConnection(connection || null);
    setSelectedLaboratoryId(connection?.laboratoryId || '');
    setLabAction(nextAction);
  };
  const submitLabAction = (payload: Record<string, string | boolean | number | string[]>) => {
    const result =
      labAction === 'connect_clinic' ? mockLaboratoryService.connectLaboratoryToClinic(String(payload.laboratoryId || selectedLaboratoryId), clinic.id, { isPreferred: Boolean(payload.isPreferred), servicesAllowed: payload.servicesAllowed as string[], defaultTurnaroundDays: Number(payload.defaultTurnaroundDays || 7), notes: String(payload.note || '') }) :
      labAction === 'disconnect_clinic' && selectedConnection ? mockLaboratoryService.disconnectLaboratoryFromClinic(selectedConnection.id, String(payload.reason || '')) :
      labAction === 'set_preferred' && selectedConnection ? mockLaboratoryService.setPreferredLaboratory(clinic.id, selectedConnection.laboratoryId) :
      { ok: false, error: 'Unsupported laboratory connection action.' };
    if (result.ok) {
      showToast(`Clinic laboratory ${String(labAction).replace('_', ' ')} completed.`, 'success');
      setLabAction(null);
      setSelectedConnection(null);
      setSelectedLaboratoryId('');
      setVersion(prev => prev + 1);
      refreshShell();
    } else showToast(result.error || 'Laboratory connection action failed.', 'error');
  };

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/platform/clinics')}><ArrowLeft size={16} /> Back to Clinics</button>
      <div className="page-header-container">
        <div><span className="metric-card-label">{clinic.clinicNumber}</span><h1>{clinic.name}</h1><p className="page-title-desc">{subscriber?.businessName || 'Unknown subscriber'} - {users.find(user => user.id === clinic.primaryOwnerUserId)?.fullName || 'Unassigned administrator'} - {clinic.city}, {clinic.province}</p><div className="badge-row"><Status status={clinic.status} />{clinic.isPrimaryClinic && <span className="badge-prototype">Primary Clinic</span>}<span className="status-badge info">{clinic.visibility}</span></div></div>
        {menu}
      </div>
      <div className="summary-grid"><Summary label="Dentists" value={dentists.length} /><Summary label="Staff" value={staff.length} /><Summary label="Assignments" value={activeAssignments.length} /><Summary label="Plan Usage" value={limit ? `${limit.usage}/${String(limit.limitValue)}` : 'Unknown'} /></div>
      <div className="module-tabs" role="tablist" aria-label="Clinic detail tabs">{tabs.map(tab => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

      {activeTab === 'Overview' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Clinic Name" value={clinic.name} /><Tile label="Legal Business" value={clinic.legalBusinessName} /><Tile label="Email" value={clinic.email} /><Tile label="Contact" value={clinic.contactNumber} /><Tile label="Address" value={`${clinic.addressLine1}, ${clinic.city}, ${clinic.province}`} /><Tile label="Country" value={clinic.country} /><Tile label="Timezone" value={clinic.timezone} /><Tile label="Description" value={clinic.description || 'None'} /><Tile label="Created" value={clinic.createdAt} /><Tile label="Updated" value={clinic.updatedAt} /></div></section>}
      {activeTab === 'Dentists' && <Assignments title="Associate Dentists" users={dentists} role="associate" assignments={activeAssignments} navigate={navigate} onAssign={() => setAction('assign_dentist')} onRemove={() => setAction('remove_assignment')} />}
      {activeTab === 'Staff' && <Assignments title="Staff Members" users={staff} role="staff" assignments={activeAssignments} navigate={navigate} onAssign={() => setAction('assign_staff')} onRemove={() => setAction('remove_assignment')} />}
      {activeTab === 'Laboratories' && <section className="dashboard-panel"><div className="toolbar-row"><h2>Laboratory Connections</h2><button className="btn btn-primary compact-action" onClick={() => openLabAction('connect_clinic')}>Connect Laboratory</button></div>{laboratoryConnections.length === 0 ? <div className="empty-state">No laboratory connections yet.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>Laboratory</th><th>Type</th><th>Status</th><th>Preferred</th><th>Services Allowed</th><th>Turnaround</th><th>Connected</th><th>Actions</th></tr></thead><tbody>{laboratoryConnections.map(({ connection, laboratory }) => <tr key={connection.id}><td>{laboratory.name}<br /><span className="muted-text">{laboratory.laboratoryNumber}</span></td><td>{laboratory.laboratoryType.replaceAll('_', ' ')}</td><td><Status status={connection.status} /></td><td>{connection.isPreferred ? <span className="badge-prototype">Preferred</span> : 'Standard'}</td><td>{connection.servicesAllowed.length || 'All active'}</td><td>{connection.defaultTurnaroundDays || laboratory.defaultTurnaroundDays} days</td><td>{connection.connectedAt}</td><td><RowActionMenu ariaLabel={`Actions for laboratory ${laboratory.laboratoryNumber}`} items={[{ id: 'view', label: 'View Laboratory', onSelect: () => navigate(`/platform/laboratories/${laboratory.id}`) }, { id: 'preferred', label: 'Set as Preferred', disabled: connection.status !== 'active', onSelect: () => openLabAction('set_preferred', connection) }, { id: 'sep', separator: true }, { id: 'disconnect', label: 'Disconnect', destructive: true, disabled: connection.status !== 'active', onSelect: () => openLabAction('disconnect_clinic', connection) }]} /></td></tr>)}</tbody></table></div>}</section>}
      {activeTab === 'Business Hours' && <section className="dashboard-panel"><div className="table-container"><table className="data-table"><thead><tr><th>Day</th><th>Status</th><th>Hours</th><th>Break</th></tr></thead><tbody>{Object.entries(clinic.businessHours).map(([day, hours]) => <tr key={day}><td>{day}</td><td>{hours.enabled ? 'Open' : 'Closed'}</td><td>{hours.enabled ? `${hours.openingTime} - ${hours.closingTime}` : 'Closed'}</td><td>{hours.enabled && hours.breakEnabled ? `${hours.breakStart} - ${hours.breakEnd}` : 'None'}</td></tr>)}</tbody></table></div></section>}
      {activeTab === 'Subscription and Plan' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Subscriber" value={subscriber?.businessName || 'Unknown'} /><Tile label="Subscription" value={subscription?.subscriptionNumber || 'None'} /><Tile label="Subscription Status" value={subscription?.status || 'None'} /><Tile label="Plan" value={plan?.name || subscription?.planId || 'Unknown'} /><Tile label="Clinic Usage Count" value={String(limit?.usage ?? 0)} /><Tile label="Plan Clinic Limit" value={String(limit?.limitValue || 'Unknown')} /><Tile label="Remaining Allowance" value={String(limit?.remaining || 'Unknown')} /><Tile label="Limit Status" value={limit?.valid ? 'Allowed' : limit?.message || 'Blocked'} /></div></section>}
      {activeTab === 'Activity' && <section className="dashboard-panel"><div className="timeline-feed">{activity.length ? activity.map(log => <div className="timeline-item" key={log.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{log.event}</strong><span>{log.timestamp}</span></div><div className="timeline-item-content">{log.details}</div></div>) : <div className="empty-state">No clinic activity recorded.</div>}</div></section>}
      {activeTab === 'Change History' && <section className="dashboard-panel"><div className="timeline-feed">{history.length ? history.map(item => <div className="timeline-item" key={item.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{item.action}</strong><span>{item.createdAt}</span></div><div className="timeline-item-content">{item.details}</div></div>) : <div className="empty-state">No clinic history recorded.</div>}</div></section>}

      <div className="toolbar-row" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setAction('change_admin')}>Change Primary Administrator</button></div>
      <ClinicActionDialog open={Boolean(action)} action={action} clinic={clinic} users={users} assignments={assignments} onClose={() => setAction(null)} onSubmit={submitAction} />
      <ClinicLaboratoryDialog open={Boolean(labAction)} action={labAction} subscriberId={clinic.subscriberId} selectedConnection={selectedConnection} selectedLaboratoryId={selectedLaboratoryId} setSelectedLaboratoryId={setSelectedLaboratoryId} onClose={() => { setLabAction(null); setSelectedConnection(null); setSelectedLaboratoryId(''); }} onSubmit={submitLabAction} />
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

function ClinicLaboratoryDialog({ open, action, subscriberId, selectedConnection, selectedLaboratoryId, setSelectedLaboratoryId, onClose, onSubmit }: { open: boolean; action: LaboratoryDialogAction | null; subscriberId: string; selectedConnection: ClinicLaboratoryConnection | null; selectedLaboratoryId: string; setSelectedLaboratoryId: (id: string) => void; onClose: () => void; onSubmit: (payload: Record<string, string | boolean | number | string[]>) => void }) {
  const [preferred, setPreferred] = useState(false);
  const [note, setNote] = useState('');
  const laboratories = mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId).filter(lab => lab.status !== 'archived');
  const selectedLaboratory = mockLaboratoryService.getLaboratoryById(selectedLaboratoryId) || laboratories[0] || null;
  if (action === 'connect_clinic') {
    return (
      <Modal open={open} title="Connect Laboratory" description="Only laboratories owned by this clinic subscriber are available." onClose={onClose} footer={<><button className="btn btn-outline" style={{ width: 'auto' }} onClick={onClose}>Cancel</button><button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => onSubmit({ laboratoryId: selectedLaboratoryId || selectedLaboratory?.id || '', isPreferred: preferred, note, defaultTurnaroundDays: selectedLaboratory?.defaultTurnaroundDays || 7, servicesAllowed: selectedLaboratory ? mockLaboratoryService.getLaboratoryServices(selectedLaboratory.id).filter(service => service.status === 'active').map(service => service.id) : [] })}>Connect Laboratory</button></>}>
        <div className="filter-grid">
          <label className="filter-control"><span>Laboratory</span><select className="form-input" value={selectedLaboratoryId || selectedLaboratory?.id || ''} onChange={event => setSelectedLaboratoryId(event.target.value)}><option value="">Choose laboratory</option>{laboratories.map(lab => <option key={lab.id} value={lab.id}>{lab.name} - {lab.status}</option>)}</select></label>
          <label className="checkbox-label"><input type="checkbox" checked={preferred} onChange={event => setPreferred(event.target.checked)} /><span>Set as Preferred Laboratory</span></label>
          <label className="filter-control"><span>Notes</span><textarea className="form-input" rows={3} value={note} onChange={event => setNote(event.target.value)} /></label>
          {laboratories.length === 0 && <div className="empty-state">No eligible laboratories under this subscriber.</div>}
        </div>
      </Modal>
    );
  }
  return <LaboratoryActionDialog open={open} action={action} laboratory={mockLaboratoryService.getLaboratoryById(selectedConnection?.laboratoryId || '')} selectedConnection={selectedConnection} onClose={onClose} onSubmit={onSubmit} />;
}

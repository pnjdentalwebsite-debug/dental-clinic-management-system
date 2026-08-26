import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { LaboratoryActionDialog, type LaboratoryDialogAction } from '../components/LaboratoryActionDialog';
import { LaboratoryActionMenu } from '../components/LaboratoryActionMenu';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import type { ClinicLaboratoryConnection, LaboratoryService } from '../types';

interface Props {
  laboratoryId: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

const tabs = ['Overview', 'Connected Clinics', 'Services', 'Business Hours', 'Subscription and Plan', 'Activity', 'Change History'];
const format = (value: string) => value.replaceAll('_', ' ');
const Status = ({ status }: { status: string }) => <span className={`status-badge ${status}`}>{format(status)}</span>;

export function LaboratoryDetailsPage({ laboratoryId, navigate, showToast, refreshShell }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [action, setAction] = useState<LaboratoryDialogAction | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ClinicLaboratoryConnection | null>(null);
  const [selectedService, setSelectedService] = useState<LaboratoryService | null>(null);
  const [, setVersion] = useState(0);
  const laboratory = mockLaboratoryService.getLaboratoryById(laboratoryId);

  if (!laboratory) return <main className="main-content"><button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => navigate('/platform/laboratories')}><ArrowLeft size={16} /> Back to Laboratories</button><div className="dashboard-panel empty-state" style={{ marginTop: '1rem' }}><h1>Laboratory not found</h1><p>This mock laboratory record does not exist.</p></div></main>;

  const subscriber = mockPlatformManagementService.getSubscriberById(laboratory.subscriberId);
  const clinics = mockClinicService.listClinics();
  const connectedClinics = mockLaboratoryService.getLaboratoryClinics(laboratory.id);
  const services = mockLaboratoryService.getLaboratoryServices(laboratory.id);
  const activeServices = services.filter(service => service.status === 'active');
  const subscription = subscriber ? mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id) : null;
  const plan = subscription ? mockPlanService.listPlans().find(item => [item.id, item.name, item.planCode].includes(subscription.planId) || item.id === subscription.priceSnapshot.planId) : null;
  const limit = subscriber ? mockLaboratoryService.validateLaboratoryLimit(subscriber.id, laboratory.id, true) : null;
  const history = mockLaboratoryService.getLaboratoryHistory(laboratory.id);
  const activity = mockPlatformManagementService.listActivity().filter(log => [laboratory.id, laboratory.laboratoryNumber, laboratory.name, subscriber?.businessName].some(value => value && log.details.includes(value)));

  const refresh = () => { setVersion(prev => prev + 1); refreshShell(); };
  const openAction = (next: LaboratoryDialogAction, connection?: ClinicLaboratoryConnection, service?: LaboratoryService) => { setAction(next); setSelectedConnection(connection || null); setSelectedService(service || null); };
  const submitAction = (payload: Record<string, string | boolean | number | string[]>) => {
    const servicePayload = {
      id: selectedService?.id || '',
      laboratoryId: laboratory.id,
      serviceCode: String(payload.serviceCode || ''),
      name: String(payload.name || ''),
      category: String(payload.category || 'other') as LaboratoryService['category'],
      description: String(payload.description || ''),
      defaultPrice: String(payload.defaultPrice || '') === '' ? undefined : Number(payload.defaultPrice),
      currency: 'PHP' as const,
      defaultTurnaroundDays: Number(payload.defaultServiceTurnaroundDays || laboratory.defaultTurnaroundDays),
      rushAvailable: Boolean(payload.rushAvailable),
      rushAdditionalDays: 2,
      rushFee: String(payload.rushFee || '') === '' ? undefined : Number(payload.rushFee),
      status: selectedService?.status || 'active' as const,
      createdAt: selectedService?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    const result =
      action === 'activate' ? mockLaboratoryService.activateLaboratory(laboratory.id) :
      action === 'deactivate' ? mockLaboratoryService.deactivateLaboratory(laboratory.id, String(payload.reason || '')) :
      action === 'archive' ? mockLaboratoryService.archiveLaboratory(laboratory.id, String(payload.reason || '')) :
      action === 'restore' ? mockLaboratoryService.restoreLaboratory(laboratory.id, true) :
      action === 'connect_clinic' ? mockLaboratoryService.connectLaboratoryToClinic(laboratory.id, String(payload.clinicId || ''), { isPreferred: Boolean(payload.isPreferred), servicesAllowed: payload.servicesAllowed as string[], defaultTurnaroundDays: Number(payload.defaultTurnaroundDays || laboratory.defaultTurnaroundDays), notes: String(payload.note || '') }) :
      action === 'disconnect_clinic' && selectedConnection ? mockLaboratoryService.disconnectLaboratoryFromClinic(selectedConnection.id, String(payload.reason || '')) :
      action === 'set_preferred' && selectedConnection ? mockLaboratoryService.setPreferredLaboratory(selectedConnection.clinicId, laboratory.id) :
      action === 'add_service' ? mockLaboratoryService.createLaboratoryService(laboratory.id, servicePayload) :
      action === 'edit_service' && selectedService ? mockLaboratoryService.updateLaboratoryService(selectedService.id, servicePayload) :
      action === 'activate_service' && selectedService ? mockLaboratoryService.activateLaboratoryService(selectedService.id) :
      action === 'deactivate_service' && selectedService ? mockLaboratoryService.deactivateLaboratoryService(selectedService.id) :
      action === 'archive_service' && selectedService ? mockLaboratoryService.archiveLaboratoryService(selectedService.id) :
      action === 'restore_service' && selectedService ? mockLaboratoryService.restoreLaboratoryService(selectedService.id) :
      { ok: false, error: 'Unsupported laboratory action.' };
    if (result.ok) {
      showToast(`Laboratory ${String(action).replace('_', ' ')} completed.`, 'success');
      setAction(null);
      setSelectedConnection(null);
      setSelectedService(null);
      refresh();
    } else showToast(result.error || 'Laboratory action failed.', 'error');
  };

  const menu = <LaboratoryActionMenu laboratory={laboratory} onEdit={() => navigate(`/platform/laboratories/${laboratory.id}/edit`)} onViewSubscriber={() => navigate(`/platform/subscribers/${laboratory.subscriberId}`)} onManageClinics={() => setActiveTab('Connected Clinics')} onManageServices={() => setActiveTab('Services')} onActivate={() => openAction('activate')} onDeactivate={() => openAction('deactivate')} onRestore={() => openAction('restore')} onArchive={() => openAction('archive')} />;

  return (
    <main className="main-content">
      <button className="btn btn-outline" style={{ width: 'auto', marginBottom: '1rem' }} onClick={() => navigate('/platform/laboratories')}><ArrowLeft size={16} /> Back to Laboratories</button>
      <div className="page-header-container"><div><span className="metric-card-label">{laboratory.laboratoryNumber}</span><h1>{laboratory.name}</h1><p className="page-title-desc">{subscriber?.businessName || 'Unknown subscriber'} - {format(laboratory.laboratoryType)} - {laboratory.city}, {laboratory.province} - {laboratory.defaultTurnaroundDays} day turnaround</p><div className="badge-row"><Status status={laboratory.status} /><span className="badge-prototype">{laboratory.visibility}</span></div></div>{menu}</div>
      <div className="summary-grid"><Summary label="Connected Clinics" value={connectedClinics.filter(item => item.connection.status === 'active').length} /><Summary label="Active Services" value={activeServices.length} /><Summary label="Default Turnaround" value={`${laboratory.defaultTurnaroundDays} days`} /><Summary label="Plan Usage" value={limit ? `${limit.usage}/${String(limit.limitValue)}` : 'Unknown'} /></div>
      <div className="module-tabs" role="tablist" aria-label="Laboratory detail tabs">{tabs.map(tab => <button key={tab} role="tab" aria-selected={activeTab === tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

      {activeTab === 'Overview' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Laboratory Name" value={laboratory.name} /><Tile label="Legal Business" value={laboratory.legalBusinessName} /><Tile label="Contact Person" value={`${laboratory.contactPersonName} - ${laboratory.contactPersonPosition}`} /><Tile label="Email" value={laboratory.email} /><Tile label="Contact" value={laboratory.contactNumber} /><Tile label="Address" value={`${laboratory.addressLine1}, ${laboratory.city}, ${laboratory.province}`} /><Tile label="Subscriber Ownership" value={subscriber?.businessName || laboratory.subscriberId} /><Tile label="Service Area" value={laboratory.serviceArea} /><Tile label="Rush Orders" value={laboratory.acceptsRushOrders ? `${laboratory.rushTurnaroundDays} days` : 'Not accepted'} /><Tile label="Description" value={laboratory.description || 'None'} /><Tile label="Created" value={laboratory.createdAt} /><Tile label="Updated" value={laboratory.updatedAt} /></div></section>}
      {activeTab === 'Connected Clinics' && <section className="dashboard-panel"><div className="toolbar-row"><h2>Connected Clinics</h2><button className="btn btn-primary compact-action" onClick={() => openAction('connect_clinic')}>Connect Laboratory</button></div>{connectedClinics.length === 0 ? <div className="empty-state">No clinic connections yet.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>Clinic</th><th>City</th><th>Status</th><th>Preferred</th><th>Connected</th><th>Allowed Services</th><th>Turnaround</th><th>Actions</th></tr></thead><tbody>{connectedClinics.map(({ connection, clinic }) => <tr key={connection.id}><td>{clinic.name}<br /><span className="muted-text">{clinic.clinicNumber}</span></td><td>{clinic.city}</td><td><Status status={connection.status} /></td><td>{connection.isPreferred ? <span className="badge-prototype">Preferred</span> : 'Standard'}</td><td>{connection.connectedAt}</td><td>{connection.servicesAllowed.length || 'All active'}</td><td>{connection.defaultTurnaroundDays || laboratory.defaultTurnaroundDays} days</td><td><ConnectionMenu onView={() => navigate(`/platform/clinics/${clinic.id}`)} onPreferred={() => openAction('set_preferred', connection)} onDisconnect={() => openAction('disconnect_clinic', connection)} disabled={connection.status !== 'active'} /></td></tr>)}</tbody></table></div>}</section>}
      {activeTab === 'Services' && <section className="dashboard-panel"><div className="toolbar-row"><h2>Laboratory Service Catalog</h2><button className="btn btn-primary compact-action" onClick={() => openAction('add_service')}>Add Service</button></div>{services.length === 0 ? <div className="empty-state">No services configured.</div> : <div className="table-container"><table className="data-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Prototype Price</th><th>Turnaround</th><th>Rush</th><th>Status</th><th>Actions</th></tr></thead><tbody>{services.map(service => <tr key={service.id}><td>{service.serviceCode}</td><td>{service.name}</td><td>{format(service.category)}</td><td>{mockLaboratoryService.formatPrice(service)}</td><td>{service.defaultTurnaroundDays} days</td><td>{service.rushAvailable ? 'Available' : 'Not available'}</td><td><Status status={service.status} /></td><td><ServiceMenu service={service} onEdit={() => openAction('edit_service', undefined, service)} onActivate={() => openAction('activate_service', undefined, service)} onDeactivate={() => openAction('deactivate_service', undefined, service)} onArchive={() => openAction('archive_service', undefined, service)} onRestore={() => openAction('restore_service', undefined, service)} /></td></tr>)}</tbody></table></div>}</section>}
      {activeTab === 'Business Hours' && <section className="dashboard-panel"><div className="table-container"><table className="data-table"><thead><tr><th>Day</th><th>Status</th><th>Hours</th><th>Break</th></tr></thead><tbody>{Object.entries(laboratory.businessHours).map(([day, hours]) => <tr key={day}><td>{day}</td><td>{hours.enabled ? 'Open' : 'Closed'}</td><td>{hours.enabled ? `${hours.openingTime} - ${hours.closingTime}` : 'Closed'}</td><td>{hours.enabled && hours.breakEnabled ? `${hours.breakStart} - ${hours.breakEnd}` : 'None'}</td></tr>)}</tbody></table></div></section>}
      {activeTab === 'Subscription and Plan' && <section className="dashboard-panel"><div className="plan-detail-grid"><Tile label="Subscriber" value={subscriber?.businessName || 'Unknown'} /><Tile label="Subscription" value={subscription?.subscriptionNumber || 'None'} /><Tile label="Subscription Status" value={subscription?.status || 'None'} /><Tile label="Plan" value={plan?.name || subscription?.planId || 'Unknown'} /><Tile label="Laboratory Usage Count" value={String(limit?.usage ?? 0)} /><Tile label="Plan Laboratory Limit" value={String(limit?.limitValue || 'Unknown')} /><Tile label="Remaining Allowance" value={String(limit?.remaining || 'Unknown')} /><Tile label="Limit Status" value={limit?.valid ? 'Allowed' : limit?.message || 'Blocked'} /></div></section>}
      {activeTab === 'Activity' && <section className="dashboard-panel"><div className="timeline-feed">{activity.length ? activity.map(log => <div className="timeline-item" key={log.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{log.event}</strong><span>{log.timestamp}</span></div><div className="timeline-item-content">{log.details}</div></div>) : <div className="empty-state">No laboratory activity recorded.</div>}</div></section>}
      {activeTab === 'Change History' && <section className="dashboard-panel"><div className="timeline-feed">{history.length ? history.map(item => <div className="timeline-item" key={item.id}><div className="timeline-marker"></div><div className="timeline-item-header"><strong>{item.action}</strong><span>{item.createdAt}</span></div><div className="timeline-item-content">{item.details}</div></div>) : <div className="empty-state">No laboratory history recorded.</div>}</div></section>}

      <LaboratoryActionDialog open={Boolean(action)} action={action} laboratory={laboratory} clinics={clinics} connections={mockLaboratoryService.getLaboratoryConnections(laboratory.id)} services={services} selectedConnection={selectedConnection} selectedService={selectedService} onClose={() => { setAction(null); setSelectedConnection(null); setSelectedService(null); }} onSubmit={submitAction} />
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) {
  return <div className="summary-card"><span>{label}</span><strong>{value}</strong></div>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return <div className="info-tile"><span>{label}</span><strong>{value}</strong></div>;
}

function ConnectionMenu({ onView, onPreferred, onDisconnect, disabled }: { onView: () => void; onPreferred: () => void; onDisconnect: () => void; disabled?: boolean }) {
  return <RowActionMenu ariaLabel="Clinic laboratory connection actions" items={[{ id: 'view', label: 'View Clinic', onSelect: onView }, { id: 'preferred', label: 'Set as Preferred', disabled, onSelect: onPreferred }, { id: 'sep', separator: true }, { id: 'disconnect', label: 'Disconnect', destructive: true, disabled, onSelect: onDisconnect }]} />;
}

function ServiceMenu({ service, onEdit, onActivate, onDeactivate, onArchive, onRestore }: { service: LaboratoryService; onEdit: () => void; onActivate: () => void; onDeactivate: () => void; onArchive: () => void; onRestore: () => void }) {
  return <RowActionMenu ariaLabel={`Actions for service ${service.serviceCode}`} items={[{ id: 'edit', label: 'Edit Service', hidden: service.status === 'archived', onSelect: onEdit }, { id: 'activate', label: 'Activate Service', hidden: service.status !== 'inactive', onSelect: onActivate }, { id: 'deactivate', label: 'Deactivate Service', hidden: service.status !== 'active', onSelect: onDeactivate }, { id: 'restore', label: 'Restore Service', hidden: service.status !== 'archived', onSelect: onRestore }, { id: 'sep', separator: true }, { id: 'archive', label: 'Archive Service', destructive: true, hidden: service.status === 'archived', onSelect: onArchive }]} />;
}

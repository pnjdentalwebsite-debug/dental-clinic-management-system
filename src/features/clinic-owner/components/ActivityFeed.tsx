import { useState, useMemo } from 'react';
import { Building, UserPlus, Users, DollarSign, FileText, FlaskConical, ChevronLeft, ChevronRight, X, Sparkles, Activity } from 'lucide-react';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import { mockAssociateDentistService } from '../services/mockAssociateDentistService';
import { mockStaffService } from '../services/mockStaffService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockClinicService } from '../../clinics/services/mockClinicService';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  icon: any;
  color: string;
}

interface ActivityFeedProps {
  subscriberId?: string;
  branchIds?: string[];
}

export function ActivityFeed({ subscriberId, branchIds = [] }: ActivityFeedProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 5;

  const activities: ActivityFeedItem[] = useMemo(() => {
    const list: ActivityFeedItem[] = [];
    const scopedBranches = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
    const branchNameById = new Map(scopedBranches.map((branch) => [branch.id, branch.name]));
    const activeBranchNames = branchIds.length
      ? branchIds.map((branchId) => branchNameById.get(branchId)).filter(Boolean)
      : scopedBranches.map((branch) => branch.name);
    const scopeLabel = activeBranchNames.length > 1
      ? `${activeBranchNames.length} clinic branches`
      : activeBranchNames[0] || 'current clinic branch';

    // 1. Real Patients
    const patients = branchIds.length > 0
      ? branchIds.flatMap((branchId) => loadPatientDirectoryRecords(branchId))
      : [];
    patients.forEach((p, idx) => {
      list.push({
        id: `pat-${p.id || idx}`,
        timestamp: p.firstVisit || 'Recent Registration',
        event: 'Patient Registered',
        details: `${p.name} was added with profile ID ${p.id}.`,
        icon: UserPlus,
        color: '#3b82f6'
      });
    });

    // 2. Real Bills & Services
    const agg = aggregateClinicFinancials(patients);
    agg.allBills.forEach((b, idx) => {
      list.push({
        id: `bill-${b.id || idx}`,
        timestamp: b.entryDate || 'Recent Treatment',
        event: 'Treatment Billed',
        details: `${b.patientName} billed PHP ${Number(b.payableAmount || 0).toLocaleString()} for ${b.services?.[0]?.service || b.description || 'Clinical procedure'}.`,
        icon: DollarSign,
        color: '#10b981'
      });
    });

    // 3. Real Payments Recorded
    agg.allPayments.forEach((p, idx) => {
      list.push({
        id: `pay-${p.id || idx}`,
        timestamp: p.paymentDate || 'Recent Settlement',
        event: 'Payment Received',
        details: `Collected PHP ${Number(p.amount || 0).toLocaleString()} via ${p.paymentMethod || 'Cash'} for ${p.patientName}.`,
        icon: DollarSign,
        color: '#0ea5e9'
      });
    });

    // 4. Real Dentists
    try {
      const dentists = subscriberId ? mockAssociateDentistService.getDentistsBySubscriberId(subscriberId) : [];
      dentists.forEach((d: any, idx: number) => {
        list.push({
          id: `dent-${d.id || idx}`,
          timestamp: 'Rostered Associate',
          event: 'Associate Dentist Active',
          details: `${d.firstName || ''} ${d.lastName || ''}`.trim() + ` assigned to ${scopeLabel}.`,
          icon: UserPlus,
          color: '#8b5cf6'
        });
      });
    } catch {
      // ignore
    }

    // 5. Real Staff
    try {
      const staff = subscriberId ? mockStaffService.getStaffBySubscriberId(subscriberId) : [];
      staff.forEach((s: any, idx: number) => {
        list.push({
          id: `stf-${s.id || idx}`,
          timestamp: 'Staff Member',
          event: 'Staff Roster Assigned',
          details: `${s.firstName || ''} ${s.lastName || ''}`.trim() + ` active as ${s.role || 'Staff Member'}.`,
          icon: Users,
          color: '#f59e0b'
        });
      });
    } catch {
      // ignore
    }

    // 6. Connected Laboratories
    try {
      const labs = subscriberId ? mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId) : [];
      const scopedLabs = branchIds.length
        ? labs.filter((l: any) => !l.clinicIds?.length || l.clinicIds.some((clinicId: string) => branchIds.includes(clinicId)))
        : labs;
      scopedLabs.forEach((l: any, idx: number) => {
        list.push({
          id: `lab-${l.id || idx}`,
          timestamp: 'Connected Partner',
          event: 'Laboratory Connected',
          details: `Connected with ${l.name} (${l.specialties?.join(', ') || 'Dental Protheses'}).`,
          icon: FlaskConical,
          color: '#ec4899'
        });
      });
    } catch {
      // ignore
    }

    // Default clinic setup activity if list is still small
    if (list.length < 4) {
      list.push(
        { id: 'def-1', timestamp: 'Today, 10:30 AM', event: 'Clinic Branch Active', details: `${scopeLabel} operational parameters active.`, icon: Building, color: '#3b82f6' },
        { id: 'def-2', timestamp: 'Yesterday', event: 'Clinical Master Files Synced', details: 'Tags, dental charting items, and fee schedules verified.', icon: FileText, color: '#10b981' }
      );
    }

    return list;
  }, [branchIds, subscriberId]);

  const previewActivities = activities.slice(0, 5);
  const totalModalPages = Math.ceil(activities.length / itemsPerPage) || 1;
  const modalActivities = activities.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

  const openModal = () => {
    setModalPage(1);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</h3>
          </div>
          {activities.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={openModal}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                width: 'auto'
              }}
            >
              <Sparkles size={13} style={{ color: 'var(--primary)' }} />
              View All ({activities.length})
            </button>
          )}
        </div>

        {/* Timeline container */}
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: '7px',
              top: '8px',
              bottom: '12px',
              width: '2px',
              backgroundColor: 'var(--border)'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {previewActivities.map((act, index) => {
              const Icon = act.icon;
              const isLastItem = index === previewActivities.length - 1 && activities.length > 5;

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    position: 'relative',
                    opacity: isLastItem ? 0.45 : 1,
                    filter: isLastItem ? 'blur(0.8px)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-1.85rem',
                      top: '3px',
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--card-bg)',
                      border: `3px solid ${act.color}`,
                      zIndex: 2
                    }}
                  />

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', width: '100%' }}>
                    <div
                      style={{
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: `${act.color}15`,
                        color: act.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.event}</strong>
                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.timestamp}</small>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{act.details}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Gradient Fade & View More Overlay */}
          {activities.length > 5 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '75px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--card-bg) 90%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '0.25rem',
                pointerEvents: 'none'
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={openModal}
                style={{
                  pointerEvents: 'auto',
                  padding: '0.35rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-md)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  width: 'auto'
                }}
              >
                + {activities.length - 4} More Activities &bull; View All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View All Modal with Pagination (5 per page) */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '620px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Clinic Recent Activity Log
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Complete chronological history ({activities.length} total events)
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '0.35rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  minWidth: 'auto'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Activity List */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: '340px' }}>
              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '8px',
                    bottom: '12px',
                    width: '2px',
                    backgroundColor: 'var(--border)'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {modalActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div key={act.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '-1.85rem',
                            top: '3px',
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--card-bg)',
                            border: `3px solid ${act.color}`,
                            zIndex: 2
                          }}
                        />

                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', width: '100%' }}>
                          <div
                            style={{
                              padding: '0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: `${act.color}15`,
                              color: act.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <strong style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.event}</strong>
                              <small style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{act.timestamp}</small>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{act.details}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer with 5-per-page Pagination */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Page {modalPage} of {totalModalPages} ({activities.length} total events)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={modalPage <= 1}
                  onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto' }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={modalPage >= totalModalPages}
                  onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto' }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

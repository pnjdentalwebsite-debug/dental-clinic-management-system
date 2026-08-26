import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Stethoscope, UserCheck, Users } from 'lucide-react';
import type { DailyDentistOutputItem, DailyStaffAttendanceItem } from '../../types/dailyReports';

interface Props {
  dentistOutputs: DailyDentistOutputItem[];
  staffAttendance: DailyStaffAttendanceItem[];
}

export function DentistStaffDailyLedger({ dentistOutputs, staffAttendance }: Props) {
  const [activeTab, setActiveTab] = useState<'DENTISTS' | 'STAFF'>('DENTISTS');
  const [dentistPage, setDentistPage] = useState(1);
  const [staffPage, setStaffPage] = useState(1);
  const itemsPerPage = 5;

  const totalDentistPages = Math.ceil(dentistOutputs.length / itemsPerPage) || 1;
  const paginatedDentists = useMemo(() => {
    const start = (dentistPage - 1) * itemsPerPage;
    return dentistOutputs.slice(start, start + itemsPerPage);
  }, [dentistOutputs, dentistPage]);

  const totalStaffPages = Math.ceil(staffAttendance.length / itemsPerPage) || 1;
  const paginatedStaff = useMemo(() => {
    const start = (staffPage - 1) * itemsPerPage;
    return staffAttendance.slice(start, start + itemsPerPage);
  }, [staffAttendance, staffPage]);

  return (
    <div
      className="dashboard-panel"
      style={{
        margin: 0,
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
        justifyContent: 'space-between'
      }}
    >
      {/* Header & Tab Switcher - Perfectly aligned with sibling cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', minHeight: '46px' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserCheck size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Clinical Roster & Productivity Ledger
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Associate dentists on duty and staff roster logs for this date.
          </span>
        </div>

        {/* Tab Pills */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--background)',
            padding: '0.2rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            gap: '0.2rem'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('DENTISTS')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: activeTab === 'DENTISTS' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'DENTISTS' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'DENTISTS' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Stethoscope size={13} />
            Dentist Production ({dentistOutputs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STAFF')}
            style={{
              padding: '0.35rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: activeTab === 'STAFF' ? 700 : 500,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'STAFF' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'STAFF' ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={13} />
            Staff Duty Logs ({staffAttendance.length})
          </button>
        </div>
      </div>

      {/* Content depending on Active Tab */}
      {activeTab === 'DENTISTS' ? (
        <>
          <div
            className="table-container"
            style={{
              margin: 0,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <table className="data-table" style={{ margin: 0, fontSize: '0.82rem', width: '100%', height: 'auto', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Associate Dentist</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Patients Served</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Procedures Summary</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDentists.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', height: '100px', verticalAlign: 'middle' }}>
                      No associate dentists recorded on roster today.
                    </td>
                  </tr>
                ) : (
                  paginatedDentists.map((doc) => (
                    <tr key={doc.dentistId} style={{ borderBottom: '1px solid var(--border)', height: '52px' }}>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              backgroundColor: `${doc.avatarColor}22`,
                              color: doc.avatarColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              border: `1px solid ${doc.avatarColor}40`
                            }}
                          >
                            DR
                          </div>
                          <div style={{ display: 'grid' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.84rem' }}>{doc.dentistName}</strong>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{doc.designation}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          {doc.patientsAttended} Patients
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                        {doc.proceduresSummary}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                        PHP {doc.revenueGenerated.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Always Visible Pagination Footer for Dentists */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <span>Showing {dentistOutputs.length > 0 ? (dentistPage - 1) * itemsPerPage + 1 : 0} to {Math.min(dentistPage * itemsPerPage, dentistOutputs.length)} of {dentistOutputs.length} dentists (5 per page)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button type="button" className="btn btn-outline" disabled={dentistPage <= 1} onClick={() => setDentistPage(p => Math.max(1, p - 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <ChevronLeft size={13} />
                Prev
              </button>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.25rem' }}>Page {dentistPage} of {totalDentistPages}</span>
              <button type="button" className="btn btn-outline" disabled={dentistPage >= totalDentistPages} onClick={() => setDentistPage(p => Math.min(totalDentistPages, p + 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className="table-container"
            style={{
              margin: 0,
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              minHeight: '500px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <table className="data-table" style={{ margin: 0, fontSize: '0.82rem', width: '100%', height: 'auto', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Staff Member</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Role</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Time In</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Time Out</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Duty Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', height: '100px', verticalAlign: 'middle' }}>
                      No staff members logged on duty today.
                    </td>
                  </tr>
                ) : (
                  paginatedStaff.map((st) => (
                    <tr key={st.staffId} style={{ borderBottom: '1px solid var(--border)', height: '52px' }}>
                      <td style={{ padding: '0.85rem 0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {st.staffName}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', color: 'var(--text-secondary)' }}>
                        {st.role}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>
                        {st.timeIn}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {st.timeOut}
                      </td>
                      <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center' }}>
                        <span
                          style={{
                            padding: '0.15rem 0.5rem',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: st.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                            color: st.status === 'PRESENT' ? '#059669' : '#d97706'
                          }}
                        >
                          {st.status === 'PRESENT' ? 'On Duty' : 'Half Day'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Always Visible Pagination Footer for Staff */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
            <span>Showing {staffAttendance.length > 0 ? (staffPage - 1) * itemsPerPage + 1 : 0} to {Math.min(staffPage * itemsPerPage, staffAttendance.length)} of {staffAttendance.length} staff (5 per page)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button type="button" className="btn btn-outline" disabled={staffPage <= 1} onClick={() => setStaffPage(p => Math.max(1, p - 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <ChevronLeft size={13} />
                Prev
              </button>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.25rem' }}>Page {staffPage} of {totalStaffPages}</span>
              <button type="button" className="btn btn-outline" disabled={staffPage >= totalStaffPages} onClick={() => setStaffPage(p => Math.min(totalStaffPages, p + 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                Next
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

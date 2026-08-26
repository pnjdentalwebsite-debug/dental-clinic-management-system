import { useEffect, useState } from 'react';
import { ArrowRight, FolderKanban, Sparkles } from 'lucide-react';
import { MasterFileWorkspaceLayout } from '../components/MasterFileWorkspaceLayout';
import { masterFileRouteGroups } from '../masterFileRoutes';
import { masterFileDirectoryService, MASTER_FILE_DIRECTORY_UPDATED_EVENT } from '../masterFileDirectoryService';

interface Props {
  currentClinic: any;
  onNavigate?: (route: string) => void;
  routeBase?: string;
}

export function MasterFileDirectoryDashboardPage({ currentClinic, onNavigate, routeBase }: Props) {
  const clinicId = currentClinic?.id || 'CLN-000013';
  const baseRoute = routeBase || `/clinic/${clinicId}/master-files`;
  const [, setCountRefreshKey] = useState(0);

  useEffect(() => {
    const syncCounts = () => {
      setCountRefreshKey((current) => current + 1);
    };

    window.addEventListener(MASTER_FILE_DIRECTORY_UPDATED_EVENT, syncCounts);
    window.addEventListener('storage', syncCounts);

    return () => {
      window.removeEventListener(MASTER_FILE_DIRECTORY_UPDATED_EVENT, syncCounts);
      window.removeEventListener('storage', syncCounts);
    };
  }, []);

  const countByKey: Record<string, number> = {
    'tooth-status': masterFileDirectoryService.getToothStatuses().length,
    'tooth-condition': masterFileDirectoryService.getTagRecords('tooth-condition').length,
    prosthodontics: masterFileDirectoryService.getTagRecords('prosthodontics').length,
    'dental-surgery': masterFileDirectoryService.getTagRecords('dental-surgery').length,
    'xray-scan-items': masterFileDirectoryService.getTagRecords('xray-scan-items').length,
    'prescription-templates': masterFileDirectoryService.getTagRecords('prescription-templates').length,
    'intra-oral-appliance': masterFileDirectoryService.getTagRecords('intra-oral-appliance').length,
    'occlusion-index': masterFileDirectoryService.getTagRecords('occlusion-index').length,
    'periodontal-psr': masterFileDirectoryService.getTagRecords('periodontal-psr').length,
    'tmj-assessment': masterFileDirectoryService.getTagRecords('tmj-assessment').length,
    'hmo-accredited': masterFileDirectoryService.getTagRecords('hmo-accredited').length,
    'recall-reasons': masterFileDirectoryService.getTagRecords('recall-reasons').length,
    'clinical-services': masterFileDirectoryService.getTagRecords('clinical-services').length,
    'medicine-catalog': masterFileDirectoryService.getTagRecords('medicine-catalog').length,
    'medical-conditions': masterFileDirectoryService.getTagRecords('medical-conditions').length,
    'dental-habits': masterFileDirectoryService.getTagRecords('dental-habits').length,
    'risk-tags': masterFileDirectoryService.getTagRecords('risk-tags').length
  };

  const totalRecords = Object.values(countByKey).reduce((acc, curr) => acc + curr, 0);

  return (
    <MasterFileWorkspaceLayout
      title="Master File Directory"
      description={`Centralized catalog of clinical definitions, charting statuses, services, templates, and document references for ${currentClinic?.name || 'Angelo Dental Clinic'}.`}
    >
      {/* Overview Banner */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(79, 123, 245, 0.1)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FolderKanban size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Clinic Master Catalog & Data Dictionary
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Real-time synchronization across clinic operations, odontogram charting, billing lines, and PDF prescriptions.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.25)'
            }}
          >
            <Sparkles size={14} />
            <span>{totalRecords} Active Reference Records</span>
          </div>
        </div>
      </div>

      {/* Route Groups Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {masterFileRouteGroups.map((group) => (
          <section key={group.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {group.label}
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({group.items.length} {group.items.length === 1 ? 'module' : 'modules'})
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem'
              }}
            >
              {group.items.map((item) => {
                const Icon = item.icon;
                const count = item.countKey ? countByKey[item.countKey] ?? 0 : null;
                const targetRoute = `${baseRoute}/${item.routeSuffix}`;

                return (
                  <div
                    key={item.key}
                    onClick={() => onNavigate && onNavigate(targetRoute)}
                    style={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(79, 123, 245, 0.08)',
                            color: 'var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        {count !== null && (
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '999px',
                              backgroundColor: count > 0 ? 'rgba(79, 123, 245, 0.1)' : 'var(--background)',
                              color: count > 0 ? 'var(--primary)' : 'var(--text-muted)',
                              border: `1px solid ${count > 0 ? 'rgba(79, 123, 245, 0.2)' : 'var(--border)'}`
                            }}
                          >
                            {count} {count === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </div>

                      <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.label}
                      </h5>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '1rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border)' }}>
                      <span
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        Manage Records <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </MasterFileWorkspaceLayout>
  );
}

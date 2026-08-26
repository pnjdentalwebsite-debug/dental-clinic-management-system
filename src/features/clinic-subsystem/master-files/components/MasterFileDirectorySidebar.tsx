import { useEffect, useState } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import {
  masterFileDirectoryService,
  MASTER_FILE_DIRECTORY_UPDATED_EVENT
} from '../masterFileDirectoryService';
import { masterFileRouteGroups } from '../masterFileRoutes';
import { MasterFileNavGroup } from './MasterFileNavGroup';

interface Props {
  currentRoute: string;
  clinicId: string;
  routeBase?: string;
  backRoute?: string;
  backLabel?: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onNavigate: (route: string) => void;
  currentClinic: any;
}

export function MasterFileDirectorySidebar({
  currentRoute,
  clinicId,
  routeBase,
  backRoute,
  backLabel = 'Exit to Main',
  sidebarCollapsed,
  setSidebarCollapsed,
  onNavigate,
  currentClinic
}: Props) {
  const displayClinicName = currentClinic?.name || currentClinic?.legalBusinessName || 'Clinic';
  const resolvedBackRoute = backRoute || `/clinic/${clinicId}/dashboard`;
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    'tooth-items': true,
    'clinical-templates': true,
    'master-files': true,
    'pdf-designer': true
  });
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

  const countByKey = {
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

  return (
    <aside className={`sidebar master-file-layout__sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Master File Directory Sidebar">
      <div className="sidebar-header clinic-subsystem-sidebar__header master-file-layout__sidebar-header">
        <div className="clinic-subsystem-sidebar__identity clinic-subsystem-sidebar__identity--compact">
          <div className="master-file-layout__brand">
            <strong className="clinic-subsystem-sidebar__title" title={displayClinicName}>
              {displayClinicName}
            </strong>
          </div>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <div className="master-file-layout__sidebar-body">
        <button
          type="button"
          className="sidebar-link master-file-layout__back-link"
          onClick={() => onNavigate(resolvedBackRoute)}
          title={sidebarCollapsed ? backLabel : undefined}
        >
          <ArrowLeft size={18} />
          <span className="sidebar-link-text master-file-layout__back-link-text">{backLabel}</span>
        </button>
        <nav className="sidebar-nav" aria-label="Master File Directory Navigation">
          {masterFileRouteGroups.map((group) => (
            <MasterFileNavGroup
              key={group.key}
              group={group}
              currentRoute={currentRoute}
              clinicId={clinicId}
              routeBase={routeBase}
              collapsed={Boolean(collapsedGroups[group.key])}
              onToggle={() =>
                setCollapsedGroups((current) => ({
                  ...current,
                  [group.key]: !current[group.key]
                }))
              }
              onNavigate={onNavigate}
              countByKey={countByKey}
              sidebarCollapsed={sidebarCollapsed}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

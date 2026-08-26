import { Copy, Download, ExternalLink, Eye, GitBranch, ShieldCheck } from 'lucide-react';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import type { AuditEvent } from '../types';

interface Props {
  event: AuditEvent;
  onView: () => void;
  onRelated?: () => void;
  onCorrelation: () => void;
  onCopyAudit: () => void;
  onCopyCorrelation: () => void;
  onExportJson?: () => void;
  onVerifyIntegrity?: () => void;
}

export function AuditActionMenu({ 
  event, 
  onView, 
  onRelated, 
  onCorrelation, 
  onCopyAudit, 
  onCopyCorrelation,
  onExportJson,
  onVerifyIntegrity
}: Props) {
  return (
    <RowActionMenu
      ariaLabel={`Actions for ${event.auditNumber}`}
      items={[
        { id: 'view', label: 'View Action Details', icon: Eye, onSelect: onView },
        { id: 'related', label: 'Open Target Record', icon: ExternalLink, hidden: !event.route || !onRelated, onSelect: onRelated },
        { id: 'correlation', label: 'View Connected Actions', icon: GitBranch, onSelect: onCorrelation },
        { id: 'verify', label: 'Check Security Status', icon: ShieldCheck, hidden: !onVerifyIntegrity, onSelect: onVerifyIntegrity },
        { id: 'export-json', label: 'View Full Record Details', icon: Download, hidden: !onExportJson, onSelect: onExportJson },
        { id: 'copy-audit', label: 'Copy Action Reference No.', icon: Copy, onSelect: onCopyAudit },
        { id: 'copy-correlation', label: 'Copy Tracking Number', icon: Copy, onSelect: onCopyCorrelation }
      ]}
    />
  );
}


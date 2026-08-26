import type { ReactNode } from 'react';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';

interface Props {
  title: string;
  description: string;
  categoryLabel?: string;
  actions?: ReactNode;
}

export function MasterFilePageHeader({
  title,
  description,
  categoryLabel = '',
  actions
}: Props) {
  return (
    <ClinicPageHeader
      sectionLabel={categoryLabel}
      title={title}
      subtitle={description}
      actions={actions}
    />
  );
}

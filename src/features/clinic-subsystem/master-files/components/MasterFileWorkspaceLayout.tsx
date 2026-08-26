import type { ReactNode } from 'react';
import { MasterFilePageHeader } from './MasterFilePageHeader';

interface Props {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function MasterFileWorkspaceLayout({
  title,
  description,
  actions,
  children
}: Props) {
  return (
    <div className="master-file-workspace-page">
      <MasterFilePageHeader
        categoryLabel=""
        title={title}
        description={description}
        actions={actions}
      />

      <div className="master-file-workspace__body">
        {children}
      </div>
    </div>
  );
}

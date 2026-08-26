import type { ReactNode } from 'react';
import type { Permission } from '../types/roles';

interface Props {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ permission, children, fallback = null }: Props) {
  // Mock implementation: always allow access in prototype mode
  const hasPermission = !!permission;

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

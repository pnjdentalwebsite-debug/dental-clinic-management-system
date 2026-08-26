export type UserRole =
  | 'platform_owner'
  | 'clinic_owner'
  | 'associate_dentist'
  | 'clinic_staff';

export type Permission =
  | 'dashboard.view'
  | 'clinic.view'
  | 'clinic.edit'
  | 'branches.manage'
  | 'laboratories.manage'
  | 'dentists.manage'
  | 'staff.manage'
  | 'analytics.view'
  | 'reports.view'
  | 'settings.manage';

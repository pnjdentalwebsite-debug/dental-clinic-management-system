import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  LogOut, 
  Menu, 
  RefreshCw, 
  Building2, 
  Check,
  ChevronRight,
  ChevronDown,
  Settings,
  LockKeyhole,
  RotateCcw,
  FlaskConical,
  AlertTriangle,
  Layers,
  CreditCard,
  DollarSign,
  BarChart3,
  Megaphone,
  History,
  Database,
  Bell,
  X
} from 'lucide-react';
import { SubscribersPage } from './features/platformManagement/pages/SubscribersPage';
import { SubscriberDetailsPage } from './features/platformManagement/pages/SubscriberDetailsPage';
import { UsersPage } from './features/platformManagement/pages/UsersPage';
import { UserDetailsPage } from './features/platformManagement/pages/UserDetailsPage';
import { PlatformDashboardPage } from './features/platformManagement/pages/PlatformDashboardPage';
import { mockPlatformManagementService, generateSecureTemporaryPassword } from './features/platformManagement/services/mockPlatformManagementService';
import { ConfirmationDialog } from './components/overlays/ConfirmationDialog';
import { Modal } from './components/overlays/Modal';
import { PlansPage } from './features/plans/pages/PlansPage';
import { PlanDetailsPage } from './features/plans/pages/PlanDetailsPage';
import { PlanFormPage } from './features/plans/pages/PlanFormPage';
import { mockPlanService } from './features/plans/services/mockPlanService';
import { SubscriptionsPage } from './features/subscriptions/pages/SubscriptionsPage';
import { SubscriptionDetailsPage } from './features/subscriptions/pages/SubscriptionDetailsPage';
import { SubscriptionFormPage } from './features/subscriptions/pages/SubscriptionFormPage';
import { mockSubscriptionService } from './features/subscriptions/services/mockSubscriptionService';
import { PaymentsPage } from './features/payments/pages/PaymentsPage';
import { PaymentDetailsPage } from './features/payments/pages/PaymentDetailsPage';
import { PaymentFormPage } from './features/payments/pages/PaymentFormPage';
import { mockPaymentService as centralizedPaymentService } from './features/payments/services/mockPaymentService';
import { ClinicsPage } from './features/clinics/pages/ClinicsPage';
import { ClinicDetailsPage } from './features/clinics/pages/ClinicDetailsPage';
import { ClinicFormPage } from './features/clinics/pages/ClinicFormPage';
import { mockClinicService } from './features/clinics/services/mockClinicService';
import { LaboratoriesPage } from './features/laboratories/pages/LaboratoriesPage';
import { LaboratoryDetailsPage } from './features/laboratories/pages/LaboratoryDetailsPage';
import { LaboratoryFormPage } from './features/laboratories/pages/LaboratoryFormPage';
import { mockLaboratoryService } from './features/laboratories/services/mockLaboratoryService';
import { AnalyticsReportsPage } from './features/analytics/pages/AnalyticsReportsPage';
import { mockAnalyticsService } from './features/analytics/services/mockAnalyticsService';
import { AuditCorrelationPage } from './features/audit/pages/AuditCorrelationPage';
import { AuditDetailsPage } from './features/audit/pages/AuditDetailsPage';
import { AuditIntegrityPage } from './features/audit/pages/AuditIntegrityPage';
import { AuditLogsPage } from './features/audit/pages/AuditLogsPage';
import { mockAuditService } from './features/audit/services/mockAuditService';
import { AnnouncementsPage } from './features/announcements/pages/AnnouncementsPage';
import { AnnouncementDetailsPage } from './features/announcements/pages/AnnouncementDetailsPage';
import { AnnouncementFormPage } from './features/announcements/pages/AnnouncementFormPage';
import { GlobalAnnouncementBanner } from './features/announcements/components/GlobalAnnouncementBanner';
import { mockAnnouncementService } from './features/announcements/services/mockAnnouncementService';
import { NotificationBell } from './features/notifications/components/NotificationBell';
import { NotificationDetailsPage } from './features/notifications/pages/NotificationDetailsPage';
import { NotificationsPage } from './features/notifications/pages/NotificationsPage';
import { mockNotificationService } from './features/notifications/services/mockNotificationService';
import { DataRestorePage } from './features/backupRestore/pages/DataRestorePage';
import { mockBackupRestoreService } from './features/backupRestore/services/mockBackupRestoreService';
import { PlatformSettingsPage } from './features/platformSettings/pages/PlatformSettingsPage';
import { mockPlatformSettingsService } from './features/platformSettings/services/mockPlatformSettingsService';
import { ClinicOwnerLayout } from './features/clinic-owner/components/ClinicOwnerLayout';
import { ClinicOwnerDashboardPage } from './features/clinic-owner/pages/ClinicOwnerDashboardPage';
import { ClinicProfilePage } from './features/clinic-owner/pages/ClinicProfilePage';
import { ClinicBranchesPage } from './features/clinic-owner/pages/ClinicBranchesPage';
import { ClinicBranchCreatePage } from './features/clinic-owner/pages/ClinicBranchCreatePage';
import { ClinicLaboratoriesPage } from './features/clinic-owner/pages/ClinicLaboratoriesPage';
import { ClinicLaboratoryFormPage } from './features/clinic-owner/pages/ClinicLaboratoryFormPage';
import { AssociateDentistFormPage } from './features/clinic-owner/pages/AssociateDentistFormPage';
import { AssociateDentistsPage } from './features/clinic-owner/pages/AssociateDentistsPage';
import { StaffManagementPage } from './features/clinic-owner/pages/StaffManagementPage';
import { StaffFormPage } from './features/clinic-owner/pages/StaffFormPage';
import { ClinicAnalyticsPage } from './features/clinic-owner/pages/ClinicAnalyticsPage';
import { SalesOverviewPage } from './features/clinic-owner/pages/SalesOverviewPage';
import { DailyReportsPage } from './features/clinic-owner/pages/DailyReportsPage';
import { GeneralSettingsPage } from './features/clinic-owner/pages/GeneralSettingsPage';
import { ClinicWorkspaceLayout } from './features/clinic-subsystem/components/ClinicWorkspaceLayout';
import { ClinicDashboardPage } from './features/clinic-subsystem/pages/ClinicDashboardPage';
import { PatientsPage } from './features/clinic-subsystem/patients/pages/PatientsPage';
import { ClinicSchedulingLayout } from './features/clinic-subsystem/scheduling/components/ClinicSchedulingLayout';
import { CalendarPage as SchedulingCalendarPage } from './features/clinic-subsystem/scheduling/pages/CalendarPage';
import { WaitlistPage as SchedulingWaitlistPage } from './features/clinic-subsystem/scheduling/pages/WaitlistPage';
import { AnalyticsOverviewPage } from './features/clinic-subsystem/pages/AnalyticsOverviewPage';
import { AnalyticsDailyPage } from './features/clinic-subsystem/pages/AnalyticsDailyPage';
import { SettingsPage } from './features/clinic-subsystem/pages/SettingsPage';
import { RoleWorkspacePage } from './features/clinic-subsystem/pages/RoleWorkspacePage';
import { RoleConsoleLayout } from './features/clinic-subsystem/components/RoleConsoleLayout';
import { MasterFileDirectoryLayout } from './features/clinic-subsystem/master-files/components/MasterFileDirectoryLayout';
import { MasterFileDirectoryDashboardPage } from './features/clinic-subsystem/master-files/pages/MasterFileDirectoryDashboardPage';
import { MasterFileDirectorySectionPage } from './features/clinic-subsystem/master-files/pages/MasterFileDirectorySectionPage';
import { PDFDesignerPage } from './features/clinic-subsystem/pdf-designer/PDFDesignerPage';
import { SubscriptionLockedScreen } from './features/clinic-owner/components/SubscriptionLockedScreen';

// Default Platform Owner credentials
const DEFAULT_PLATFORM_OWNER = {
  email: "pnjdentalwebsite@gmail.com",
  password: "pjDental**001",
  role: "platform_owner",
  status: "active",
  name: "PNJ Platform Administrator"
};

const DEMO_OTP = "482193";

// ----------------------------------------------------
// CENTRALIZED MOCK STORAGE SERVICE LAYER
// ----------------------------------------------------

interface Registration {
  id: string;
  plan: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string;
  ownerAddress: string;
  clinicName: string;
  clinicEmail: string;
  clinicMobile: string;
  clinicAddress: string;
  dentistsCount: number;
  staffCount: number;
  locationsCount: number;
  worksWithLab: boolean;
  labName?: string;
  emailVerified: boolean;
  paymentStatus: 'unpaid' | 'pending_verification' | 'approved' | 'rejected';
  registrationStatus: 'registration_submitted' | 'email_verification_pending' | 'payment_pending' | 'payment_under_review' | 'account_ready' | 'registration_completed';
  submittedDate: string;
  updatedDate: string;
  referenceNumber?: string;
  paymentMethod?: string;
  tempPassword?: string;
  rejectionReason?: string;
  subscriberId?: string;
  userId?: string;
}

interface User {
  email: string;
  passwordHash: string; // Plaintext for prototype mock use
  role: 'platform_owner' | 'clinic_owner' | 'associate' | 'staff';
  status: 'active' | 'suspended';
  name: string;
  clinicName?: string;
  planName?: string;
  mustChangePassword?: boolean;
  subscriberId?: string;
  clinicIds?: string[];
  linkedRecordId?: string;
  privileges?: Record<string, boolean>;
}

interface OtpRecord {
  registrationId: string;
  otpCode: string;
  expiresAt: number;
  attempts: number;
  verified: boolean;
}

interface PaymentRecord {
  id: string;
  registrationId: string;
  method: string;
  referenceNumber: string;
  amount: string;
  submittedDate: string;
  status: 'unpaid' | 'pending_verification' | 'approved' | 'rejected';
  adminNotes?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  role: string;
}

interface Session {
  email: string;
  role: 'platform_owner' | 'clinic_owner' | 'associate' | 'staff';
  name: string;
  clinicName?: string;
  planName?: string;
  subscriberId?: string;
  clinicIds?: string[];
  privileges?: Record<string, boolean>;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

type AccountStatusCheck =
  | {
      kind: 'ready';
      title: string;
      message: string;
      clinicName?: string;
      ownerName?: string;
      tempPassword?: string;
    }
  | {
      kind: 'pending' | 'rejected' | 'not_found';
      title: string;
      message: string;
      clinicName?: string;
      ownerName?: string;
    };

// LocalStorage helpers to load safe defaults
const SESSION_STORAGE_KEY = 'pnj_mock_session';
const LEGACY_SESSION_STORAGE_KEY = 'pnj_mock_sessions';

const getInitialRoute = () => {
  const path = window.location.pathname;
  return path && path !== '/' ? path : '/login';
};

const getModuleNameFromRoute = (route: string) => {
  if (route === '/maintenance') return 'Maintenance';
  if (route === '/platform/dashboard' || route === '/clinic/dashboard') return 'Dashboard';
  if (route.startsWith('/platform/subscribers') || route.startsWith('/platform/registrations')) return 'Clinic Owners';
  if (route.startsWith('/platform/users')) return 'Clinic Staff & Doctors';
  if (route.startsWith('/platform/clinics')) return 'Dental Clinics';
  if (route.startsWith('/platform/laboratories')) return 'Partner Laboratories';
  if (route.startsWith('/platform/plans')) return 'Subscription Plans';
  if (route.startsWith('/platform/subscriptions')) return 'Active Subscriptions';
  if (route.startsWith('/platform/payments')) return 'Payments & Receipts';
  if (route.startsWith('/platform/analytics-reports')) return 'Reports & Analytics';
  if (route.startsWith('/platform/announcements')) return 'Announcements & Notices';
  if (route.startsWith('/platform/audit-logs')) return 'Activity History';
  if (route.startsWith('/platform/data-restore')) return 'Backup & Recovery';
  if (route.startsWith('/platform/notifications')) return 'Alerts & Notifications';
  if (route.startsWith('/platform/settings')) return 'System Settings';
  
  // Clinic Owner Routes
  if (route === '/clinic/profile') return 'Clinic Profile';
  if (
    route === '/clinic/branches' ||
    route === '/clinic/branches/new' ||
    route.startsWith('/clinic/branches/view/') ||
    route.startsWith('/clinic/branches/edit/')
  ) return 'Clinic Branches';
  if (
      route === '/clinic/laboratories' ||
      route === '/clinic/laboratories/new' ||
      route.startsWith('/clinic/laboratories/view/') ||
      route.startsWith('/clinic/laboratories/edit/')
    ) return 'Dental Laboratories';
  if (
      route === '/clinic/dentists' ||
      route === '/clinic/dentists/new' ||
      route.startsWith('/clinic/dentists/view/') ||
      route.startsWith('/clinic/dentists/edit/')
    ) return 'Associate Dentists';
  if (route === '/clinic/staff') return 'Staff Management';
  if (route === '/clinic/analytics') return 'Analytics';
  if (route === '/clinic/sales') return 'Sales Overview';
  if (route === '/clinic/daily-reports') return 'Daily Reports';
  if (route.endsWith('/patients')) return 'Patients';
  if (route === '/clinic/patients') return 'Patients';
  if (route === '/clinic/settings') return 'General Settings';
  if (route === '/clinic/directory' || route.startsWith('/clinic/directory/')) return 'Master File Directory';

  // Clinic Subsystem Routes
  if (route === '/clinic-subsystem/dashboard') return 'Dashboard';
  if (route === '/clinic-subsystem/patients') return 'Patients';
  if (route === '/clinic-subsystem/calendar') return 'Calendar';
  if (route === '/clinic-subsystem/waitlist') return 'Daily Waitlist';
  if (route === '/clinic-subsystem/analytics') return 'Overview Results';
  if (route === '/clinic-subsystem/daily-results') return 'Daily Results';
  if (route === '/clinic-subsystem/settings') return 'Settings';
  if (route === '/clinic-subsystem/directory' || route.includes('/master-files')) return 'Master File Directory';
  if (route.includes('/analytics/overview')) return 'Overview Results';
  if (route.includes('/analytics/daily')) return 'Daily Results';
  return 'Dashboard';
};

const getLocalStorageJSON = (key: string, defaultVal: any) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const MAX_ACTIVITY_LOGS = 500;

const setLocalStorageJSON = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Quota exceeded or storage unavailable: trim the largest known collections and retry once.
    if (key === 'pnj_mock_activity_logs' && Array.isArray(data)) {
      const trimmed = data.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        // Even the trimmed payload is too large; drop the key entirely to recover.
        try {
          localStorage.removeItem(key);
        } catch {
          // Storage is completely unavailable; ignore to keep the app running.
        }
        return;
      }
    }
    if (key === 'pnj_mock_audit_logs' && Array.isArray(data)) {
      const trimmed = data.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    // Generic fallback: attempt to remove the key to recover storage space.
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};

const mockStorage = {
  getUsers: (): User[] => getLocalStorageJSON('pnj_mock_users', [
    {
      email: DEFAULT_PLATFORM_OWNER.email,
      passwordHash: DEFAULT_PLATFORM_OWNER.password,
      role: DEFAULT_PLATFORM_OWNER.role as any,
      status: DEFAULT_PLATFORM_OWNER.status as any,
      name: DEFAULT_PLATFORM_OWNER.name
    }
  ]),
  setUsers: (users: User[]) => setLocalStorageJSON('pnj_mock_users', users),

  getRegistrations: (): Registration[] => getLocalStorageJSON('pnj_mock_registrations', []),
  setRegistrations: (regs: Registration[]) => setLocalStorageJSON('pnj_mock_registrations', regs),

  getOtpRecords: (): OtpRecord[] => getLocalStorageJSON('pnj_mock_otp_records', []),
  setOtpRecords: (otps: OtpRecord[]) => setLocalStorageJSON('pnj_mock_otp_records', otps),

  getPayments: (): PaymentRecord[] => getLocalStorageJSON('pnj_mock_payments', []),
  setPayments: (payments: PaymentRecord[]) => setLocalStorageJSON('pnj_mock_payments', payments),

  getActivityLogs: (): ActivityLog[] => getLocalStorageJSON('pnj_mock_activity_logs', []),
  setActivityLogs: (logs: ActivityLog[]) => setLocalStorageJSON('pnj_mock_activity_logs', logs.slice(0, MAX_ACTIVITY_LOGS)),

  getSession: (): Session | null => {
    const session = getLocalStorageJSON(SESSION_STORAGE_KEY, null);
    if (session) return session;

    const legacySession = getLocalStorageJSON(LEGACY_SESSION_STORAGE_KEY, null);
    if (legacySession) {
      setLocalStorageJSON(SESSION_STORAGE_KEY, legacySession);
      localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    }
    return legacySession;
  },
  setSession: (session: Session | null) => {
    localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    setLocalStorageJSON(SESSION_STORAGE_KEY, session);
  }
};

// ----------------------------------------------------
// SERVICE LAYER WRAPPERS
// ----------------------------------------------------

export const mockActivityService = {
  logEvent: (event: string, details: string, role: string) => {
    const logs = mockStorage.getActivityLogs();
    const newLog: ActivityLog = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
      event,
      details,
      role
    };
    mockStorage.setActivityLogs([newLog, ...logs]);
  },
  getLogs: () => mockStorage.getActivityLogs()
};

export const mockAuthService = {
  login: (email: string, passwordHash: string): { success: boolean; error?: string; user?: User } => {
    const regs = mockStorage.getRegistrations();
    const reg = regs.find(r => r.ownerEmail?.toLowerCase() === email.toLowerCase());
    const deletedList = getLocalStorageJSON('pnj_mock_deleted_subscribers', []);
    if (deletedList.map((s: string) => String(s || '').toLowerCase()).includes(email.toLowerCase())) {
      return { success: false, error: 'This account has been permanently removed.' };
    }

    let users = mockStorage.getUsers();
    let matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // Cross-Module Context Sync: Dynamically sync Auth Users with Platform Users & Registrations
    const platformUsers = mockPlatformManagementService.listUsers();
    const pu = platformUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const platformSubscribers = mockPlatformManagementService.listSubscribers();
    const platformClinics = mockPlatformManagementService.listClinics();
    const linkedSubscriber = pu?.subscriberId
      ? platformSubscribers.find(sub => sub.id === pu.subscriberId)
      : platformSubscribers.find(sub => sub.email.toLowerCase() === email.toLowerCase());
    const linkedClinic = pu?.clinicIds?.[0]
      ? platformClinics.find(clinic => clinic.id === pu.clinicIds[0])
      : undefined;
    const latestTempPass = reg?.tempPassword || (pu as any)?.tempPassword;
    
    if (!matched && (pu || reg)) {
      return {
        success: false,
        error: 'This account is not ready for sign-in yet. Please wait for platform payment approval and temporary password provisioning.'
      };
    } else if (matched) {
      if (pu) {
        matched.status = pu.accountStatus === 'suspended' ? 'suspended' : 'active';
        matched.role = pu.role as any;
        matched.name = pu.fullName;
        matched.clinicName = linkedClinic?.name || linkedSubscriber?.primaryClinicName || linkedSubscriber?.businessName || reg?.clinicName || matched.clinicName;
        matched.planName = linkedSubscriber?.planId || reg?.plan || matched.planName;
      }
      // If user inputs the approved temporary password, accept and sync it
      if (latestTempPass && (passwordHash === latestTempPass || matched.passwordHash === latestTempPass)) {
        matched.passwordHash = passwordHash;
        matched.mustChangePassword = true;
      }
      mockStorage.setUsers(users.map(u => u.email.toLowerCase() === matched?.email.toLowerCase() ? matched : u));
    }

    if (!matched) {
      return { success: false, error: 'Email address not found.' };
    }
    
    if (matched.status === 'suspended') {
      return { success: false, error: 'Your account has been suspended. Please contact platform support.' };
    }
    
    // Validate password: match passwordHash or latest temporary password
    const isPasswordValid = matched.passwordHash === passwordHash || (latestTempPass && latestTempPass === passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Email or password is incorrect. Please check your credentials and try again.' };
    }

    if (latestTempPass && latestTempPass === passwordHash) {
      matched.passwordHash = passwordHash;
      mockStorage.setUsers(users.map(u => u.email.toLowerCase() === matched?.email.toLowerCase() ? matched : u));
    }

    // Set mock session details
    const session: Session = {
      email: matched.email,
      role: matched.role,
      name: matched.name,
      clinicName: matched.clinicName,
      planName: matched.planName,
      subscriberId: matched.subscriberId,
      clinicIds: matched.clinicIds
      , privileges: matched.privileges
    };
    mockStorage.setSession(session);
    mockActivityService.logEvent('User Sign-In', `${matched.name} successfully authenticated.`, matched.role);
    
    return { success: true, user: matched };
  },

  logout: () => {
    const session = mockStorage.getSession();
    if (session) {
      mockActivityService.logEvent('User Sign-Out', `${session.name} logged out.`, session.role);
    }
    mockStorage.setSession(null);
  },

  getCurrentSession: () => mockStorage.getSession(),
  
  updatePassword: (email: string, oldPass: string, newPass: string): boolean => {
    const users = mockStorage.getUsers();
    let updated = false;
    const nextUsers = users.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === oldPass) {
        updated = true;
        return { ...u, passwordHash: newPass, mustChangePassword: false };
      }
      return u;
    });
    if (updated) {
      mockStorage.setUsers(nextUsers);
      mockActivityService.logEvent('Password Reset', `Password changed successfully for ${email}.`, 'clinic_owner');
    }
    return updated;
  }
};

export const mockRegistrationService = {
  createRegistration: (data: Partial<Registration>): string => {
    const regs = mockStorage.getRegistrations();
    const nextId = `REG-2026-${String(regs.length + 1).padStart(6, '0')}`;
    
    // Ensure fresh registration email is never blocked by stale deleted list
    if (data.ownerEmail) {
      const deletedList = getLocalStorageJSON('pnj_mock_deleted_subscribers', []);
      const cleaned = deletedList.filter((s: string) => String(s || '').toLowerCase() !== data.ownerEmail?.toLowerCase() && String(s || '') !== nextId);
      if (cleaned.length !== deletedList.length) {
        setLocalStorageJSON('pnj_mock_deleted_subscribers', cleaned);
      }
    }

    const newReg: Registration = {
      id: nextId,
      plan: data.plan || 'Plus',
      ownerName: data.ownerName || '',
      ownerEmail: data.ownerEmail || '',
      ownerMobile: data.ownerMobile || '',
      ownerAddress: data.ownerAddress || '',
      clinicName: data.clinicName || '',
      clinicEmail: data.clinicEmail || '',
      clinicMobile: data.clinicMobile || '',
      clinicAddress: data.clinicAddress || '',
      dentistsCount: data.dentistsCount || 1,
      staffCount: data.staffCount || 1,
      locationsCount: data.locationsCount || 1,
      worksWithLab: data.worksWithLab || false,
      labName: data.labName,
      emailVerified: false,
      paymentStatus: 'unpaid',
      registrationStatus: 'email_verification_pending',
      submittedDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    mockStorage.setRegistrations([...regs, newReg]);
    mockActivityService.logEvent('Registration Started', `New clinic registration ${nextId} submitted for ${data.clinicName}.`, 'guest');
    return nextId;
  },

  getRegistrations: () => mockStorage.getRegistrations(),
  
  getRegistrationById: (id: string) => {
    return mockStorage.getRegistrations().find(r => r.id === id) || null;
  },

  updateRegistrationStatus: (id: string, updates: Partial<Registration>) => {
    const regs = mockStorage.getRegistrations();
    const updatedRegs = regs.map(r => {
      if (r.id === id) {
        return { ...r, ...updates, updatedDate: new Date().toISOString().split('T')[0] };
      }
      return r;
    });
    mockStorage.setRegistrations(updatedRegs);
  }
};

export const mockOtpService = {
  generateOtp: (regId: string): string => {
    const otps = mockStorage.getOtpRecords();
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minute expiry
    
    // Deactivate previous OTPs
    const filteredOtps = otps.filter(o => o.registrationId !== regId);
    
    const newRecord: OtpRecord = {
      registrationId: regId,
      otpCode: DEMO_OTP,
      expiresAt,
      attempts: 0,
      verified: false
    };
    mockStorage.setOtpRecords([...filteredOtps, newRecord]);
    mockActivityService.logEvent('OTP Issued', `OTP issued successfully for registration ID ${regId}.`, 'guest');
    return DEMO_OTP;
  },

  verifyOtp: (regId: string, inputCode: string): { success: boolean; error?: string } => {
    const otps = mockStorage.getOtpRecords();
    const record = otps.find(o => o.registrationId === regId);
    if (!record) {
      return { success: false, error: 'OTP transaction not active.' };
    }
    
    if (record.verified) {
      return { success: true };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, error: 'The verification code has expired.' };
    }

    if (record.attempts >= 5) {
      return { success: false, error: 'Maximum verification attempts exceeded.' };
    }

    // Increment attempts
    record.attempts += 1;
    mockStorage.setOtpRecords([...otps]);

    if (inputCode === record.otpCode) {
      record.verified = true;
      mockStorage.setOtpRecords([...otps]);
      
      // Update registration details
      mockRegistrationService.updateRegistrationStatus(regId, {
        emailVerified: true,
        registrationStatus: 'payment_pending'
      });
      mockActivityService.logEvent('Email Verified', `Registration ${regId} verified via OTP code.`, 'guest');
      return { success: true };
    } else {
      return { success: false, error: 'Incorrect verification code. Please check details and try again.' };
    }
  }
};

export const mockPaymentService = {
  submitPayment: (regId: string, method: string, refNum: string): boolean => {
    const payments = mockStorage.getPayments();
    const payId = `PAY-${Date.now()}`;
    const newPayment: PaymentRecord = {
      id: payId,
      registrationId: regId,
      method,
      referenceNumber: refNum,
      amount: '₱0.00 (Final Pending)',
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'pending_verification'
    };
    mockStorage.setPayments([...payments, newPayment]);
    
    // Update status
    mockRegistrationService.updateRegistrationStatus(regId, {
      paymentStatus: 'pending_verification',
      registrationStatus: 'payment_under_review',
      referenceNumber: refNum,
      paymentMethod: method
    });
    mockActivityService.logEvent('Payment Details Submitted', `Reference ${refNum} submitted for registration ${regId}.`, 'guest');
    return true;
  },

  getPayments: () => mockStorage.getPayments(),

  approvePayment: (regId: string): string => {
    const payments = mockStorage.getPayments();
    const nextPayments = payments.map(p => {
      if (p.registrationId === regId) {
        return { ...p, status: 'approved' as const };
      }
      return p;
    });
    mockStorage.setPayments(nextPayments);

    // Generate Clinic Owner credentials
    const reg = mockRegistrationService.getRegistrationById(regId);
    if (!reg) return '';

    const generatedPassword = reg.tempPassword || generateSecureTemporaryPassword();
    const subscriberId = reg.subscriberId || `SUB-${Date.now().toString().slice(-6)}`;
    const userId = reg.userId || `USR-${Date.now().toString().slice(-6)}`;

    // Create clinic owner user account
    const users = mockStorage.getUsers();
    const newUser: User = {
      email: reg.ownerEmail,
      passwordHash: generatedPassword,
      role: 'clinic_owner',
      status: 'active',
      name: reg.ownerName,
      clinicName: reg.clinicName,
      planName: reg.plan,
      mustChangePassword: true
    };
    
    // Filter duplicates
    const nextUsers = users.filter(u => u.email.toLowerCase() !== reg.ownerEmail.toLowerCase());
    mockStorage.setUsers([...nextUsers, newUser]);

    // Update registration details
    mockRegistrationService.updateRegistrationStatus(regId, {
      paymentStatus: 'approved',
      registrationStatus: 'account_ready',
      tempPassword: generatedPassword,
      subscriberId,
      userId
    });

    mockActivityService.logEvent('Account Provisioned', `Clinic Owner account provisioned for ${reg.ownerEmail}.`, 'platform_owner');
    return generatedPassword;
  },

  rejectPayment: (regId: string, reason: string) => {
    const payments = mockStorage.getPayments();
    const nextPayments = payments.map(p => {
      if (p.registrationId === regId) {
        return { ...p, status: 'rejected' as const, adminNotes: reason };
      }
      return p;
    });
    mockStorage.setPayments(nextPayments);

    // Update status
    mockRegistrationService.updateRegistrationStatus(regId, {
      paymentStatus: 'rejected',
      registrationStatus: 'payment_pending',
      rejectionReason: reason
    });
    mockActivityService.logEvent('Payment Rejected', `Payment verification rejected for ${regId}. Reason: ${reason}`, 'platform_owner');
  }
};

// ----------------------------------------------------
// MAIN APP CONTROLLER
// ----------------------------------------------------

export default function App() {
  // Routing & Session State
  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState<boolean>(false);
  const [resetMockModalOpen, setResetMockModalOpen] = useState<boolean>(false);
  const [resetMockConfirmation, setResetMockConfirmation] = useState<string>('');
  const [staleSafePurgeModalOpen, setStaleSafePurgeModalOpen] = useState<boolean>(false);
  const [staleSafePurgeConfirmation, setStaleSafePurgeConfirmation] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Platform Sidebar Collapsible Dropdown Sections State (Default: all closed)
  const [platformSidebarOpenSections, setPlatformSidebarOpenSections] = useState<Record<string, boolean>>({
    overview: false,
    subscriber_management: false,
    facilities_management: false,
    subscription_management: false,
    system: false
  });

  const togglePlatformSection = (sectionKey: string) => {
    setPlatformSidebarOpenSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
  // Dashboard & Navigation Context
  const [activeModule, setActiveModule] = useState<string>('Dashboard');
  const [userRole, setUserRole] = useState<'platform_owner' | 'clinic_owner' | 'associate' | 'staff' | 'guest'>('guest');
  const [loggedUserEmail, setLoggedUserEmail] = useState<string>('');
  const [loggedUserName, setLoggedUserName] = useState<string>('');
  const [loggedClinicName, setLoggedClinicName] = useState<string>('');
  const [loggedPlanName, setLoggedPlanName] = useState<string>('');

  // Subsystem Router Context
  let currentClinic: any = null;
  let isSubsystemRoute = false;

  if (currentRoute.startsWith('/clinic/')) {
    const parts = currentRoute.split('/');
    if (parts.length >= 3) {
      const secondSegment = parts[2];
      const staticClinicOwnerRoutes = ['dashboard', 'profile', 'branches', 'laboratories', 'dentists', 'staff', 'analytics', 'sales', 'daily-reports', 'settings', 'directory', 'change-password'];
      if (!staticClinicOwnerRoutes.includes(secondSegment)) {
        isSubsystemRoute = true;
        currentClinic = mockClinicService.getClinicById(secondSegment);
      }
    }
  }
  const isOwnerMasterFileRoute = currentRoute === '/clinic/directory' || currentRoute.startsWith('/clinic/directory/');
  const authenticatedRoleUser = loggedUserEmail
    ? mockStorage.getUsers().find((user) => user.email.toLowerCase() === loggedUserEmail.toLowerCase())
    : undefined;
  const assignedClinicIds = authenticatedRoleUser?.clinicIds || [];

  // Check active subscription status for Clinic routes
  const subscriberRecord = React.useMemo(() => {
    if (!loggedUserEmail) return null;
    const subs = mockPlatformManagementService.listSubscribers();
    const platformUser = mockPlatformManagementService.listUsers()
      .find(user => user.email?.toLowerCase() === loggedUserEmail?.toLowerCase());
    return (
      (platformUser?.subscriberId ? subs.find(s => s.id === platformUser.subscriberId) : null) ||
      subs.find(s => s.email?.toLowerCase() === loggedUserEmail?.toLowerCase()) ||
      null
    );
  }, [loggedUserEmail, currentRoute]);

  if (
    isSubsystemRoute &&
    currentClinic &&
    userRole === 'clinic_owner' &&
    (!subscriberRecord || currentClinic.subscriberId !== subscriberRecord.id)
  ) {
    currentClinic = null;
  }
  if (isSubsystemRoute && currentClinic && (userRole === 'associate' || userRole === 'staff') && !assignedClinicIds.includes(currentClinic.id)) {
    currentClinic = null;
  }
  if (isSubsystemRoute && currentClinic && userRole === 'staff' && currentRoute.includes('/master-files')) {
    currentClinic = null;
  }
  if (isSubsystemRoute && currentClinic && userRole === 'associate' && currentRoute.endsWith('/settings')) {
    currentClinic = null;
  }
  if (isSubsystemRoute && currentClinic && userRole === 'associate' && currentRoute.endsWith('/calendar') && authenticatedRoleUser?.privileges?.viewCalendar === false) {
    currentClinic = null;
  }

  const activeSubscription = React.useMemo(() => {
    if (!subscriberRecord) return null;
    return mockSubscriptionService.getSubscriptionById(subscriberRecord.subscriptionId) ||
           mockSubscriptionService.getSubscriptionBySubscriberId(subscriberRecord.id)[0] ||
           null;
  }, [subscriberRecord, currentRoute]);

  const isSubscriptionLocked = Boolean(
    activeSubscription &&
    ['suspended', 'expired', 'cancelled'].includes(activeSubscription.status)
  );

  // Toast notifications state queue
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Registration states
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activeRegistrationId, setActiveRegistrationId] = useState<string>('');

  // Selected registration for admin details view
  const [selectedRegAdmin, setSelectedRegAdmin] = useState<Registration | null>(null);
  const [approvePaymentModalOpen, setApprovePaymentModalOpen] = useState<boolean>(false);
  const [rejectPaymentModalOpen, setRejectPaymentModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [provisionSuccessModalOpen, setProvisionSuccessModalOpen] = useState<boolean>(false);
  const [provisionSuccessData, setProvisionSuccessData] = useState<{
    clinicName: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    tempPassword: string;
    subscriberId?: string;
  } | null>(null);

  // Clinic Registration wizard state variables
  const [regPlan, setRegPlan] = useState<string>('');
  const [regBillingCycle, setRegBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regMobile, setRegMobile] = useState<string>('');
  const [regAddress, setRegAddress] = useState<string>('');
  const [regCity, setRegCity] = useState<string>('');
  const [regProvince, setRegProvince] = useState<string>('');
  const [regPostalCode, setRegPostalCode] = useState<string>('');
  const [regTermsAccepted, setRegTermsAccepted] = useState<boolean>(false);
  const [regPrivacyAccepted, setRegPrivacyAccepted] = useState<boolean>(false);

  // Clinic Details Form
  const [regClinicName, setRegClinicName] = useState<string>('');
  const [regClinicEmail, setRegClinicEmail] = useState<string>('');
  const [regClinicMobile, setRegClinicMobile] = useState<string>('');
  const [regClinicAddress, setRegClinicAddress] = useState<string>('');
  const [regClinicCity, setRegClinicCity] = useState<string>('');
  const [regClinicProvince, setRegClinicProvince] = useState<string>('');
  const [regClinicPostalCode, setRegClinicPostalCode] = useState<string>('');
  const [regDentistsCount, setRegDentistsCount] = useState<number>(1);
  const [regStaffCount, setRegStaffCount] = useState<number>(1);
  const [regLocationsCount, setRegLocationsCount] = useState<number>(1);
  const [regWorksWithLab, setRegWorksWithLab] = useState<boolean>(false);
  const [regLabName, setRegLabName] = useState<string>('');

  // Review & Submit validations
  const [regDeclarationConfirmed, setRegDeclarationConfirmed] = useState<boolean>(false);

  // Email verification inputs
  const [otpFields, setOtpFields] = useState<string[]>(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState<number>(180);
  const [otpError, setOtpError] = useState<string>('');

  // Payment form variables
  const [paymentMethod, setPaymentMethod] = useState<string>('GCash');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Login form inputs
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [capsLockActive, setCapsLockActive] = useState<boolean>(false);

  // Forgot Password Modal states
  const [forgotModalOpen, setForgotModalOpen] = useState<boolean>(false);
  const [forgotEmailInput, setForgotEmailInput] = useState<string>('');
  const [forgotSubmitted, setForgotSubmitted] = useState<boolean>(false);

  // Login Validation states
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [accountStatusCheck, setAccountStatusCheck] = useState<AccountStatusCheck | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Clinic Owner Reset state variables
  const [tempPasswordInput, setTempPasswordInput] = useState<string>('');
  const [newPasswordInput, setNewPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [passwordChangeError, setPasswordChangeError] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Form Error states
  const [accountFormErrors, setAccountFormErrors] = useState<Record<string, string>>({});

  // Timer countdown for OTP
  useEffect(() => {
    let interval: any;
    if (currentRoute === '/register/verify-email' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentRoute, otpTimer]);

  const handleLoadDemoCredentials = () => {
    setEmail(DEFAULT_PLATFORM_OWNER.email);
    setPassword(DEFAULT_PLATFORM_OWNER.password);
    setEmailError('');
    setPasswordError('');
    setAuthError('');
    showToast("Platform Administrator credentials loaded.", "info");
  };

  const handleLoadClinicOwnerCredentials = () => {
    const regs = mockStorage.getRegistrations();
    const approvedRegs = regs.filter(r => r.paymentStatus === 'approved' && r.tempPassword);
    const approvedReg = approvedRegs[approvedRegs.length - 1];
    if (approvedReg && approvedReg.tempPassword) {
      setEmail(approvedReg.ownerEmail);
      setPassword(approvedReg.tempPassword);
      setEmailError('');
      setPasswordError('');
      setAuthError('');
      showToast(`Clinic Owner (${approvedReg.clinicName}) credentials loaded.`, "info");
      return;
    }

    const platformUsers = mockPlatformManagementService.listUsers();
    const ownerUsers = platformUsers.filter(u => u.role === 'clinic_owner' && (u as any).tempPassword);
    const latestOwner = ownerUsers[ownerUsers.length - 1];
    if (latestOwner && (latestOwner as any).tempPassword) {
      setEmail(latestOwner.email);
      setPassword((latestOwner as any).tempPassword);
      setEmailError('');
      setPasswordError('');
      setAuthError('');
      showToast(`Clinic Owner (${latestOwner.fullName}) credentials loaded.`, "info");
      return;
    }

    showToast("No approved clinic owner account found yet. Please register or approve a registration first.", "info");
  };

  const handleOpenForgotPassword = () => {
    setForgotEmailInput(email || '');
    setForgotSubmitted(false);
    setForgotModalOpen(true);
  };

  const handleSendPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailInput.trim()) {
      showToast("Please enter your registered email address.", "warning");
      return;
    }
    setForgotSubmitted(true);
    showToast(`Password reset code dispatched to ${forgotEmailInput}.`, "success");
  };

  const validateAccountInfo = () => {
    const errors: Record<string, string> = {};
    if (!regFirstName) errors.firstName = 'First Name is required.';
    if (!regLastName) errors.lastName = 'Last Name is required.';
    if (!regEmail) {
      errors.email = 'Email Address is required.';
    } else if (!/\S+@\S+\.\S+/.test(regEmail)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!regMobile) errors.mobile = 'Mobile Number is required.';
    if (!regAddress) errors.address = 'Address is required.';
    if (!regTermsAccepted) errors.terms = 'You must accept the terms.';
    if (!regPrivacyAccepted) errors.privacy = 'You must accept the privacy policy.';

    setAccountFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateClinicInfo = () => {
    const errors: Record<string, string> = {};
    if (!regClinicName) errors.clinicName = 'Clinic Name is required.';
    if (!regClinicEmail) {
      errors.clinicEmail = 'Clinic Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(regClinicEmail)) {
      errors.clinicEmail = 'Enter a valid email address.';
    }
    if (!regClinicMobile) errors.clinicMobile = 'Contact Number is required.';
    if (!regClinicAddress) errors.clinicAddress = 'Clinic Address is required.';
    if (regWorksWithLab && !regLabName) errors.labName = 'Laboratory Name is required.';

    return Object.keys(errors).length === 0;
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasteData = e.clipboardData.getData('text').trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const nextFields = pasteData.split('');
      setOtpFields(nextFields);
      showToast("Verification code pasted.", "info");
    }
  };

  // Sync state data on refresh
  const syncStateFromStorage = () => {
    const list = mockStorage.getRegistrations();
    setRegistrations(list);
    
    const session = mockStorage.getSession();
    if (session) {
      setLoggedUserEmail(session.email);
      setLoggedUserName(session.name);
      setLoggedClinicName(session.clinicName || '');
      setLoggedPlanName(session.planName || '');
      setUserRole(session.role);

      // Route Guard
      if (session.role === 'platform_owner') {
        if (!currentRoute.startsWith('/platform/')) {
          setCurrentRoute('/platform/dashboard');
          setActiveModule('Dashboard');
        }
      } else if (session.role === 'clinic_owner') {
        const users = mockStorage.getUsers();
        const curUser = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
        if (currentRoute.startsWith('/platform/')) {
          mockAuditService.appendAuditEvent({
            eventKey: `denied-${session.email}-${currentRoute}`,
            action: 'auth.route_access_denied',
            category: 'authorization',
            module: 'route_guard',
            actorType: 'subscriber_user',
            actorId: session.email,
            actorName: session.name,
            actorRole: 'clinic_owner',
            targetType: 'route',
            targetId: currentRoute,
            targetLabel: currentRoute,
            result: 'denied',
            severity: 'medium',
            summary: `Access denied to ${currentRoute}.`
          });
        }
        
        if (curUser && curUser.mustChangePassword) {
          setCurrentRoute('/clinic/change-password');
        } else {
          if (!currentRoute.startsWith('/clinic/')) {
            setCurrentRoute('/clinic/dashboard');
            setActiveModule('Dashboard');
          }
        }
      } else if (session.role === 'associate' || session.role === 'staff') {
        // Personnel may enter only an assigned branch workspace. Clinic-owner
        // console routes and the shared clinic dashboard are not role targets.
        if (currentRoute.startsWith('/clinic/') && !isSubsystemRoute) {
          setCurrentRoute(`/${session.role}/workspace`);
        } else if (!currentRoute.startsWith('/clinic/') && !currentRoute.startsWith(`/${session.role}/`)) {
          setCurrentRoute(`/${session.role}/workspace`);
        }
      }
    } else {
      setUserRole('guest');
      // Public route guard
      const isPublic = 
        currentRoute === '/login' || 
        currentRoute === '/unauthorized' ||
        currentRoute === '/account-suspended' ||
        currentRoute === '/maintenance' ||
        currentRoute === '/not-found' ||
        currentRoute.startsWith('/register/') || 
        currentRoute.includes('/status/');
      
      if (!isPublic) {
        setCurrentRoute('/login');
      }
    }

    const guardRole = mockStorage.getSession()?.role || 'guest';
    if (currentRoute !== '/maintenance' && mockPlatformSettingsService.isMaintenanceActiveForRoute(currentRoute, guardRole)) {
      setCurrentRoute('/maintenance');
    }
  };

  useEffect(() => {
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    mockSubscriptionService.initializeSubscriptions();
    centralizedPaymentService.initializePayments();
    mockClinicService.initializeClinics();
    mockLaboratoryService.initializeLaboratories();
    mockNotificationService.initializeNotifications();
    mockAnnouncementService.initializeAnnouncements();
    mockAnnouncementService.processScheduledAnnouncements();
    mockNotificationService.reconcileNotifications();
    mockAuditService.initializeAuditLogs();
    mockPlatformSettingsService.initializeSettings();
    syncStateFromStorage();
    setActiveModule(getModuleNameFromRoute(currentRoute));
  }, [currentRoute]);

  useEffect(() => {
    if (window.location.pathname !== currentRoute) {
      window.history.replaceState(null, '', currentRoute);
    }
  }, [currentRoute]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const resolveEmailOnlyAccountStatus = (rawEmail: string): AccountStatusCheck => {
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const registrations = mockPlatformManagementService.listRegistrations();
    const registration = registrations.find(reg => String(reg.ownerEmail || '').toLowerCase() === normalizedEmail);
    const subscribers = mockPlatformManagementService.listSubscribers();
    const subscriber = subscribers.find(sub => String(sub.email || '').toLowerCase() === normalizedEmail);
    const users = mockPlatformManagementService.listUsers();
    const ownerUser = users.find(user => String(user.email || '').toLowerCase() === normalizedEmail && user.role === 'clinic_owner');
    const authUser = mockStorage.getUsers().find(user => String(user.email || '').toLowerCase() === normalizedEmail);

    if (!registration && !subscriber && !ownerUser) {
      return {
        kind: 'not_found',
        title: 'No registration found',
        message: 'We could not find a clinic owner registration for this email. Please check the email spelling or register a clinic first.'
      };
    }

    if (registration?.paymentStatus === 'rejected') {
      return {
        kind: 'rejected',
        title: 'Registration needs attention',
        message: registration.rejectionReason
          ? `Your payment verification was rejected: ${registration.rejectionReason}`
          : 'Your payment verification was rejected. Please contact the platform administrator for the next steps.',
        clinicName: registration.clinicName,
        ownerName: registration.ownerName
      };
    }

    const tempPassword = registration?.tempPassword || (authUser?.mustChangePassword ? authUser.passwordHash : '');
    const hasProvisionedAuth = Boolean(authUser && (tempPassword || !authUser.mustChangePassword));
    const hasActivePlatformIdentity = subscriber?.accountStatus === 'active' && ownerUser?.accountStatus === 'active';
    const isApproved = registration?.registrationStatus === 'account_ready' || registration?.paymentStatus === 'approved';
    const isReady = (isApproved || hasActivePlatformIdentity) && hasProvisionedAuth;

    if (isReady) {
      return {
        kind: 'ready',
        title: 'Account approved and ready',
        message: tempPassword
          ? 'Your clinic owner account is approved. Sign in using your email and the temporary password issued by the platform.'
          : 'Your clinic owner account is active. Sign in using your email and current password.',
        clinicName: registration?.clinicName || subscriber?.primaryClinicName || subscriber?.businessName,
        ownerName: registration?.ownerName || ownerUser?.fullName,
        tempPassword
      };
    }

    if (isApproved || hasActivePlatformIdentity) {
      return {
        kind: 'pending',
        title: 'Account approved, setup incomplete',
        message: 'Your payment is approved, but the login credential was not provisioned cleanly yet. Please ask the platform administrator to re-run payment approval so a fresh temporary password is issued.',
        clinicName: registration?.clinicName || subscriber?.primaryClinicName || subscriber?.businessName,
        ownerName: registration?.ownerName || ownerUser?.fullName
      };
    }

    return {
      kind: 'pending',
      title: 'Registration still under review',
      message: registration?.paymentStatus === 'unpaid'
        ? 'Your clinic registration is saved, but payment has not been submitted or verified yet.'
        : 'Your clinic registration/payment is still awaiting platform approval. A temporary password will be issued once approved.',
      clinicName: registration?.clinicName || subscriber?.primaryClinicName || subscriber?.businessName,
      ownerName: registration?.ownerName || ownerUser?.fullName
    };
  };

  const handleEmailOnlyAccountStatusCheck = () => {
    const status = resolveEmailOnlyAccountStatus(email);
    setAccountStatusCheck(status);
    showToast(status.title, status.kind === 'ready' ? 'success' : status.kind === 'rejected' ? 'error' : status.kind === 'pending' ? 'warning' : 'info');
    mockAuditService.appendAuditEvent({
      action: 'auth.email_status_check',
      category: 'authentication',
      module: 'auth',
      actorType: 'anonymous',
      actorId: email || 'unknown-email',
      actorName: 'Anonymous Prototype Actor',
      actorRole: 'anonymous',
      targetType: 'registration',
      targetId: email || 'unknown-email',
      result: status.kind === 'not_found' ? 'failure' : 'success',
      severity: status.kind === 'rejected' ? 'medium' : 'low',
      summary: `Email-only account status check returned: ${status.title}`,
      metadata: { email, status: status.kind }
    });
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setAuthError('');
    setAccountStatusCheck(null);

    // Validations
    let hasError = false;
    if (!email) {
      setEmailError('Email address is required.');
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address.');
      hasError = true;
    }

    if (!password) {
      if (!hasError) {
        handleEmailOnlyAccountStatusCheck();
        return;
      }
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoggingIn(true);
    setTimeout(() => {
      const res = mockAuthService.login(email, password);
      setIsLoggingIn(false);
      if (res.success && res.user) {
        mockAuditService.appendAuditEvent({
          action: 'auth.login.success',
          category: 'authentication',
          module: 'auth',
          actorType: res.user.role === 'platform_owner' ? 'platform_user' : 'subscriber_user',
          actorId: res.user.email,
          actorName: res.user.name,
          actorRole: res.user.role,
          targetType: 'session',
          targetId: res.user.email,
          result: 'success',
          severity: 'low',
          summary: `${res.user.name} signed in successfully.`,
          metadata: { email: res.user.email }
        });
        showToast(`Welcome back, ${res.user.name}!`, "success");
        if (res.user.role === 'platform_owner') {
          setCurrentRoute('/platform/dashboard');
          setActiveModule('Dashboard');
        } else {
          if (res.user.mustChangePassword) {
            setCurrentRoute('/clinic/change-password');
          } else if (res.user.role === 'associate' || res.user.role === 'staff') {
            setCurrentRoute(`/${res.user.role}/workspace`);
          } else {
            setCurrentRoute('/clinic/dashboard');
            setActiveModule('Dashboard');
          }
        }
      } else {
        mockAuditService.appendAuditEvent({
          action: 'auth.login.failure',
          category: 'authentication',
          module: 'auth',
          actorType: 'anonymous',
          actorId: email || 'unknown-email',
          actorName: 'Anonymous Prototype Actor',
          actorRole: 'anonymous',
          targetType: 'session',
          targetId: email || 'unknown-email',
          result: 'failure',
          severity: 'medium',
          summary: 'Login failed.',
          description: res.error || 'Authentication failed.',
          errorMessage: res.error,
          metadata: { email, password }
        });
        setAuthError(res.error || 'Authentication failed.');
      }
    }, 1000);
  };

  const handleLogoutConfirm = () => {
    mockAuditService.appendAuditEvent({
      action: 'auth.logout',
      category: 'authentication',
      module: 'auth',
      targetType: 'session',
      targetId: loggedUserEmail,
      result: 'success',
      severity: 'low',
      summary: `${loggedUserName || loggedUserEmail} signed out.`
    });
    setLogoutModalOpen(false);
    mockAuthService.logout();
    showToast("You have signed out successfully.", "success");
    setEmail('');
    setPassword('');
    setCurrentRoute('/login');
  };

  // Onboarding submissions
  const handleRegistrationSubmit = () => {
    if (!regDeclarationConfirmed) {
      showToast("Please confirm the details declaration checkbox first.", "warning");
      return;
    }

    const regId = mockRegistrationService.createRegistration({
      plan: regPlan,
      ownerName: `${regFirstName} ${regLastName}`,
      ownerEmail: regEmail,
      ownerMobile: regMobile,
      ownerAddress: `${regAddress}, ${regCity}, ${regProvince}, ${regPostalCode}`,
      clinicName: regClinicName,
      clinicEmail: regClinicEmail,
      clinicMobile: regClinicMobile,
      clinicAddress: `${regClinicAddress}, ${regClinicCity}, ${regClinicProvince}, ${regClinicPostalCode}`,
      dentistsCount: regDentistsCount,
      staffCount: regStaffCount,
      locationsCount: regLocationsCount,
      worksWithLab: regWorksWithLab,
      labName: regWorksWithLab ? regLabName : undefined
    });

    setActiveRegistrationId(regId);
    mockOtpService.generateOtp(regId);
    setOtpTimer(180);
    setOtpFields(['', '', '', '', '', '']);
    showToast("Your registration has been submitted successfully.", "success");
    setCurrentRoute('/register/verify-email');
  };

  const handleVerifyOtp = () => {
    if (otpTimer === 0) {
      setOtpError('The verification code has expired. Please request a new code.');
      return;
    }

    const code = otpFields.join('');
    setOtpError('');
    if (code.length < 6) {
      setOtpError('Please complete all 6 code boxes.');
      return;
    }

    const res = mockOtpService.verifyOtp(activeRegistrationId, code);
    if (res.success) {
      showToast("Email verified successfully!", "success");
      setCurrentRoute('/register/payment');
    } else {
      setOtpError(res.error || 'Incorrect OTP code.');
    }
  };

  const handleResendOtp = () => {
    mockOtpService.generateOtp(activeRegistrationId);
    setOtpTimer(180);
    setOtpFields(['', '', '', '', '', '']);
    setOtpError('');
    showToast("A new verification code has been generated.", "success");
  };

  const handleCompleteDemoPayment = () => {
    if (paymentMethod !== 'Demo Payment' && !paymentRef) {
      showToast("Please enter a payment Reference Number.", "error");
      return;
    }

    const paymentResult = centralizedPaymentService.submitRegistrationPayment(activeRegistrationId, paymentMethod, paymentRef || 'DEMO-PAY-REF');
    if (!paymentResult.ok) {
      showToast(paymentResult.error || "Payment submission failed.", "error");
      return;
    }
    mockAuditService.appendAuditEvent({
      action: 'payment.submitted',
      category: 'payment',
      module: 'payments',
      targetType: 'payment',
      targetId: activeRegistrationId,
      targetLabel: paymentRef || 'DEMO-PAY-REF',
      result: 'success',
      severity: 'low',
      summary: `Payment reference "${paymentRef || 'DEMO-PAY-REF'}" submitted for registration ${activeRegistrationId} awaiting admin verification.`,
      afterSnapshot: { paymentStatus: 'pending_verification', paymentMethod, referenceNumber: paymentRef || 'DEMO-PAY-REF' }
    });
    mockNotificationService.createSystemNotification({
      eventKey: `payment-pending-${activeRegistrationId}`,
      category: 'payment',
      sourceModule: 'payments',
      sourceRecordId: activeRegistrationId,
      title: 'Payment Verification Pending',
      message: `Payment reference ${paymentRef || 'DEMO-PAY-REF'} submitted for registration ${activeRegistrationId}.`,
      priority: 'high',
      actionUrl: '/platform/payments',
      actionLabel: 'Review Payment'
    });
    showToast("Payment submitted and awaiting admin verification.", "success");
    setCurrentRoute(`/register/status/${activeRegistrationId}`);
  };


  const handleShowProvisionSuccess = (data: {
    clinicName: string;
    ownerName: string;
    ownerEmail: string;
    plan: string;
    tempPassword?: string;
    subscriberId?: string;
  }) => {
    setProvisionSuccessData({
      clinicName: data.clinicName,
      ownerName: data.ownerName,
      ownerEmail: data.ownerEmail,
      plan: data.plan,
      tempPassword: data.tempPassword || generateSecureTemporaryPassword(),
      subscriberId: data.subscriberId
    });
    setProvisionSuccessModalOpen(true);
  };

  // Platform admin approvals
  const handleApprovePayment = () => {
    if (!selectedRegAdmin) return;
    const approvalCorrelationId = `CORR-${new Date().toISOString().split('T')[0].replaceAll('-', '')}-${selectedRegAdmin.id}`;
    const res = centralizedPaymentService.approveRegistrationPayment(selectedRegAdmin.id);
    if (res.ok) {
      const approvedReg = mockRegistrationService.getRegistrationById(selectedRegAdmin.id);
      const provisionedSubscriber = mockPlatformManagementService.getSubscriberByRegistrationId(selectedRegAdmin.id)
        || mockPlatformManagementService.listSubscribers().find(sub => sub.email.toLowerCase() === selectedRegAdmin.ownerEmail.toLowerCase());
      const tempPass = approvedReg?.tempPassword || generateSecureTemporaryPassword();
      const provisionedSubscriberId = provisionedSubscriber?.id || approvedReg?.subscriberId;
      mockClinicService.initializeClinics();
      mockLaboratoryService.initializeLaboratories();
      // Sync State
      const updated = mockRegistrationService.getRegistrationById(selectedRegAdmin.id);
      setSelectedRegAdmin(updated);
      setApprovePaymentModalOpen(false);
      mockAuditService.createCorrelatedAuditEvents([
        { action: 'payment.approved', category: 'payment', module: 'payments', targetType: 'payment', targetId: selectedRegAdmin.id, targetLabel: selectedRegAdmin.referenceNumber || selectedRegAdmin.id, result: 'success', severity: 'medium', summary: `Payment approved for ${selectedRegAdmin.clinicName}.`, beforeSnapshot: { paymentStatus: selectedRegAdmin.paymentStatus, registrationStatus: selectedRegAdmin.registrationStatus }, afterSnapshot: { paymentStatus: 'approved', registrationStatus: updated?.registrationStatus || 'account_ready' } },
        { action: 'registration.account_provisioned', category: 'registration', module: 'registration', targetType: 'registration', targetId: selectedRegAdmin.id, targetLabel: selectedRegAdmin.clinicName, result: 'success', severity: 'medium', summary: `Registration provisioned for ${selectedRegAdmin.ownerEmail}.`, metadata: { temporaryPassword: tempPass } }
      ], approvalCorrelationId);
      mockNotificationService.createSystemNotification({
        eventKey: `payment-approved-${selectedRegAdmin.id}`,
        category: 'payment',
        sourceModule: 'payments',
        sourceRecordId: selectedRegAdmin.id,
        title: 'Payment Approved & Subscription Active',
        message: `Subscription provisioned for ${selectedRegAdmin.clinicName} (${selectedRegAdmin.plan} Plan).`,
        priority: 'high',
        actionUrl: `/platform/subscribers`,
        actionLabel: 'View Subscriber'
      });
      showToast("Registration approved and clinic owner account provisioned.", "success");
      syncStateFromStorage();
      handleShowProvisionSuccess({
        clinicName: approvedReg?.clinicName || selectedRegAdmin.clinicName,
        ownerName: approvedReg?.ownerName || selectedRegAdmin.ownerName,
        ownerEmail: approvedReg?.ownerEmail || selectedRegAdmin.ownerEmail,
        plan: approvedReg?.plan || selectedRegAdmin.plan,
        tempPassword: tempPass,
        subscriberId: provisionedSubscriberId
      });
    } else {
      showToast(res.error || 'Failed to approve payment.', 'error');
    }
  };

  const handleRejectPayment = () => {
    if (!selectedRegAdmin || !rejectReason) {
      showToast("Please enter a rejection reason.", "error");
      return;
    }
    const res = centralizedPaymentService.rejectRegistrationPayment(selectedRegAdmin.id, rejectReason);
    if (!res.ok) {
      showToast(res.error || 'Failed to reject payment.', 'error');
      return;
    }
    const updated = mockRegistrationService.getRegistrationById(selectedRegAdmin.id);
    setSelectedRegAdmin(updated);
    setRejectPaymentModalOpen(false);
    mockAuditService.appendAuditEvent({
      action: 'payment.rejected',
      category: 'payment',
      module: 'payments',
      targetType: 'payment',
      targetId: selectedRegAdmin.id,
      targetLabel: selectedRegAdmin.referenceNumber || selectedRegAdmin.id,
      result: 'success',
      severity: 'medium',
      summary: `Payment rejected for ${selectedRegAdmin.clinicName}.`,
      beforeSnapshot: { paymentStatus: selectedRegAdmin.paymentStatus },
      afterSnapshot: { paymentStatus: 'rejected', rejectionReason: rejectReason }
    });
    mockNotificationService.createSystemNotification({
      eventKey: `payment-rejected-${selectedRegAdmin.id}`,
      category: 'payment',
      sourceModule: 'payments',
      sourceRecordId: selectedRegAdmin.id,
      title: 'Payment Verification Rejected',
      message: `Payment for ${selectedRegAdmin.clinicName} was rejected. Reason: ${rejectReason}`,
      priority: 'high',
      actionUrl: `/platform/payments`,
      actionLabel: 'Review Payments'
    });
    showToast("Payment details rejected.", "error");
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');

    const currentPassword = tempPasswordInput;
    const nextPassword = newPasswordInput;
    const confirmedPassword = confirmPasswordInput;
    const passwordHasMinimums = nextPassword.length >= 8 && /[A-Za-z]/.test(nextPassword) && /\d/.test(nextPassword);

    if (!loggedUserEmail) {
      setPasswordChangeError('Your sign-in session was not found. Please sign in again using your temporary password.');
      showToast('Session expired. Please sign in again.', 'warning');
      setCurrentRoute('/login');
      return;
    }

    if (!currentPassword || !nextPassword || !confirmedPassword) {
      setPasswordChangeError('Please complete the temporary password, new password, and confirmation fields.');
      return;
    }

    if (!passwordHasMinimums) {
      setPasswordChangeError('Use at least 8 characters with at least one letter and one number.');
      return;
    }

    if (nextPassword !== confirmedPassword) {
      setPasswordChangeError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === nextPassword) {
      setPasswordChangeError('Your new password must be different from the temporary password.');
      return;
    }

    setIsChangingPassword(true);
    const res = mockAuthService.updatePassword(loggedUserEmail, currentPassword, nextPassword);
    if (res) {
      const syncResult = mockPlatformManagementService.completePasswordChangeByEmail(loggedUserEmail);
      mockAuditService.appendAuditEvent({
        action: 'auth.password_change',
        category: 'authentication',
        module: 'auth',
        targetType: 'user',
        targetId: loggedUserEmail,
        targetLabel: loggedUserName,
        result: 'success',
        severity: 'medium',
        summary: `${userRole} password changed after temporary password sign-in.`,
        metadata: { email: loggedUserEmail, platformSync: syncResult.ok ? 'synced' : 'missing-platform-user' }
      });
      setTempPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setIsChangingPassword(false);
      showToast("Password updated. Welcome to your workspace.", "success");
      setCurrentRoute(userRole === 'associate' || userRole === 'staff' ? `/${userRole}/workspace` : '/clinic/dashboard');
      setActiveModule('Dashboard');
    } else {
      setIsChangingPassword(false);
      setPasswordChangeError('Could not change password. Please verify the temporary password issued by the platform.');
      showToast('Temporary password did not match.', 'error');
    }
  };

  const handleCancelPasswordChange = () => {
    setTempPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setPasswordChangeError('');
    mockAuthService.logout();
    setUserRole('guest');
    setLoggedUserEmail('');
    setLoggedUserName('');
    setLoggedClinicName('');
    setLoggedPlanName('');
    setCurrentRoute('/login');
    showToast('Password change is required before entering the clinic console.', 'warning');
  };

  // Dev bypass triggers
  const handleResetMockData = () => {
    const result = mockBackupRestoreService.resetMockData(resetMockConfirmation);
    if (!result.ok) {
      showToast(result.error || 'Reset blocked.', 'error');
      return;
    }
    mockAuthService.logout();
    setResetMockModalOpen(false);
    setResetMockConfirmation('');
    setUserRole('guest');
    setLoggedUserEmail('');
    setLoggedUserName('');
    setLoggedClinicName('');
    setLoggedPlanName('');
    showToast("Prototype mock environment reset successfully.", "success");
    setEmail('');
    setPassword('');
    setCurrentRoute('/login');
    syncStateFromStorage();
  };

  const handleStaleSafePurge = () => {
    const result = mockBackupRestoreService.staleSafePurge(staleSafePurgeConfirmation);
    if (!result.ok) {
      showToast(result.error || 'Stale-safe purge blocked.', 'error');
      return;
    }
    setStaleSafePurgeModalOpen(false);
    setStaleSafePurgeConfirmation('');
    showToast('Stale-safe purge completed. Processed platform ledgers were cleared.', 'success');
    syncStateFromStorage();
  };

  const triggerRefresh = () => {
    setIsRefreshing(true);
    showToast("Syncing data bank...", "info");
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Metrics updated.", "success");
      syncStateFromStorage();
    }, 800);
  };

  const handleSidebarClick = (name: string, route: string) => {
    setActiveModule(name);
    setCurrentRoute(route);
    setMobileSidebarOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", "success");
  };

  const renderMasterFileDirectoryContent = (routeBase: string, clinicContext: any) => {
    const route = currentRoute === routeBase ? `${routeBase}/dashboard` : currentRoute;

    if (route === `${routeBase}/dashboard`) {
      return <MasterFileDirectoryDashboardPage currentClinic={clinicContext} onNavigate={setCurrentRoute} routeBase={routeBase} />;
    }
    if (route === `${routeBase}/tooth-status`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Tooth Status"
          description="Route shell for managing reusable tooth status records and chart color definitions."
          categoryId="tooth-status"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/dental-conditions`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Tooth Condition"
          description="Manage clinical conditions and odontogram meanings used in dental charting."
          categoryId="tooth-condition"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/procedure-tags`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Procedure Tags"
          description="Route shell for reusable procedure and notation tag records."
        />
      );
    }
    if (route === `${routeBase}/restorations`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Prosthodontics"
          description="Prosthodontic procedures and restorations used in charting."
          categoryId="prosthodontics"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/surgery`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Dental Surgery"
          description="Dental surgery procedures available in the tooth chart."
          categoryId="dental-surgery"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/xray`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="X-Ray Scan Items"
          description="Diagnostic X-ray and imaging items used in charting."
          categoryId="xray-scan-items"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/prescriptions`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Prescriptions"
          description="Manage reusable prescription sets and diagnosis notes."
          categoryId="prescription-templates"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/intra-oral-appliance`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Intra Oral Appliance"
          description="Manage appliance assessment definitions for orthodontic and recall charting."
          categoryId="intra-oral-appliance"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/occlusion-index`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Occlusion Index"
          description="Manage molar class, overjet, overbite, and interpretation references."
          categoryId="occlusion-index"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/periodontal-psr`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Periodontal PSR"
          description="Manage periodontal screening and oral hygiene reference items."
          categoryId="periodontal-psr"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/tmj-assessment`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="TMJ Assessment"
          description="Manage TMJ and muscular finding reference items."
          categoryId="tmj-assessment"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/hmo-accredited`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="HMO Accredited"
          description="Manage accredited HMO and insurance provider references."
          categoryId="hmo-accredited"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/recall-reasons`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Recall Reasons"
          description="Manage reusable recall reasons for progress notes and follow-up scheduling."
          categoryId="recall-reasons"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/clinical-services`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Clinical Services"
          description="Manage treatment services, procedures, and default prices."
          categoryId="clinical-services"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/medicine-catalog`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Medicine Catalog"
          description="Manage reusable medicine catalog records."
          categoryId="medicine-catalog"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/medical-conditions`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Medical Conditions"
          description="Manage reusable medical checklist and warning conditions."
          categoryId="medical-conditions"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/dental-habits`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Dental Habits"
          description="Manage reusable dental and oral habit checklist records."
          categoryId="dental-habits"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/tags`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Tags"
          description="Manage reusable clinic tags and patient categorization labels."
          categoryId="risk-tags"
          showToast={showToast}
        />
      );
    }
    if (route === `${routeBase}/certificates`) {
      return (
        <MasterFileDirectorySectionPage
          sectionLabel="MASTER FILE DIRECTORY"
          title="Certificate Templates"
          description="Route shell for future clinic certificate template configuration."
        />
      );
    }
    if (route === `${routeBase}/modify-pdf`) {
      return <PDFDesignerPage currentClinic={clinicContext} />;
    }

    return <MasterFileDirectoryDashboardPage currentClinic={clinicContext} onNavigate={setCurrentRoute} routeBase={routeBase} />;
  };

  // Page specific computed metrics
  const subscriptionSummary = mockSubscriptionService.getSubscriptionSummary();
  const paymentSummary = centralizedPaymentService.getPaymentSummary();
  const clinicSummary = mockClinicService.getClinicSummary();
  const laboratorySummary = mockLaboratoryService.getLaboratorySummary();
  const notificationSummary = mockNotificationService.getNotificationSummary();
  const announcementSummary = mockAnnouncementService.getAnnouncementSummary();
  const auditSummary = mockAuditService.getAuditSummary();
  const dashboardAnalytics = mockAnalyticsService.getDashboardMetrics();
  const platformSettings = mockPlatformSettingsService.getSettings();
  const backupSummary = mockBackupRestoreService.getBackupSummary();
  const computedPendingPayments = dashboardAnalytics.pendingPayments;
  const routeRegistrationId = currentRoute.startsWith('/platform/registrations/')
    ? decodeURIComponent(currentRoute.split('/').pop() || '')
    : '';
  const selectedRegistrationForRoute = selectedRegAdmin || registrations.find(r => r.id === routeRegistrationId) || null;
  const statusRegistrationId = currentRoute.includes('/register/status/')
    ? decodeURIComponent(currentRoute.split('/').pop() || '')
    : activeRegistrationId;
  const statusRegistration = statusRegistrationId
    ? mockRegistrationService.getRegistrationById(statusRegistrationId)
    : null;
  const publicRegistrationPlans = mockPlanService.getPublicRegistrationPlans();

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast" style={{
            borderLeft: toast.type === 'error' ? '4px solid var(--danger)' : 
                       toast.type === 'success' ? '4px solid var(--success)' : 
                       toast.type === 'warning' ? '4px solid var(--warning)' : '4px solid var(--info)'
          }}>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* LOGIN PAGE */}
      {currentRoute === '/login' && (
        <div className="login-layout">
          {/* Left panel: Modern Dental Healthcare Showcase */}
          <div className="login-left" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '3.5rem 3rem',
            background: 'linear-gradient(145deg, #1e3a8a 0%, #1e40af 50%, #0f172a 100%)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Decorative Rings */}
            <div style={{
              position: 'absolute',
              top: '-10%',
              right: '-15%',
              width: '420px',
              height: '420px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '-15%',
              left: '-10%',
              width: '380px',
              height: '380px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(255,255,255,0) 70%)',
              pointerEvents: 'none'
            }} />

            {/* Top Brand Header */}
            <div>
              <div className="login-logo-container" style={{ color: 'white', marginBottom: '2.5rem' }}>
                <div className="login-logo-icon" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <FlaskConical size={26} color="#ffffff" />
                </div>
                <span className="login-logo-text" style={{ color: '#ffffff', fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  PJ Dental Cloud System
                </span>
              </div>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                backgroundColor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#93c5fd',
                marginBottom: '1.25rem'
              }}>
                ✨ Complete Dental Practice Management
              </span>

              <h1 style={{ fontSize: '2.35rem', fontWeight: 800, lineHeight: '1.2', margin: '0 0 1.25rem 0', color: '#ffffff' }}>
                Modernize Your Dental Clinic Operations
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.975rem', lineHeight: '1.65', maxWidth: '460px', margin: 0 }}>
                From patient scheduling and interactive dental charting to multi-branch management and official collections — all in one centralized and secure platform.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2.5rem 0' }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>🦷</div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>Interactive Dental Charting</strong>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', display: 'block' }}>
                  FDI, Universal, & Palmer Odontograms with real-time notations.
                </span>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>🏥</div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>Multi-Branch Facilities</strong>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', display: 'block' }}>
                  Manage multiple branches, dental chairs, and personnel rosters.
                </span>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>💵</div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>Daily Drawer Balancing</strong>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', display: 'block' }}>
                  Automated End-of-Day cash reconciliation and receipts ledger.
                </span>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>🔒</div>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>Data Safety & Privacy</strong>
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', display: 'block' }}>
                  Automatic safety backups and Philippine DPA compliance.
                </span>
              </div>
            </div>

            {/* Bottom Proof Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span>System Status: <strong>All Clinic Services Operational</strong></span>
            </div>
          </div>

          {/* Form Right Panel */}
          <div className="login-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 2rem' }}>
            <div className="login-card" style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '2.25rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
            }}>
              {/* Header Title */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb'
                    }}>
                      <FlaskConical size={20} />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>PJ Dental</span>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }}>
                    Secure Sign-In
                  </span>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>Welcome Back</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Please sign in to access your clinic workspace.</p>
              </div>

              {/* Demo Persona Switcher (Convenient 1-Click Auto-Fill) */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '0.75rem 0.85rem',
                marginBottom: '1.25rem'
              }}>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ⚡ Quick Demo Accounts (Click to Fill)
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleLoadDemoCredentials}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>👑</span> Platform Admin
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadClinicOwnerCredentials}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.3rem 0.65rem',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#0f172a',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                  >
                    <span>🏥</span> Clinic Owner
                  </button>
                </div>
              </div>

              {authError && (
                <div className="banner-alert danger" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.825rem',
                  marginBottom: '1rem'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>{authError}</div>
                </div>
              )}

              <form onSubmit={handleSignIn} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor="email" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem', display: 'block' }}>
                    Email Address
                  </label>
                  <input 
                    id="email"
                    type="email" 
                    className={`form-input ${emailError ? 'error' : ''}`}
                    placeholder="e.g. clinicowner@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAccountStatusCheck(null);
                    }}
                    style={{
                      height: '42px',
                      borderRadius: '10px',
                      fontSize: '0.875rem',
                      border: emailError ? '1px solid #ef4444' : '1px solid #cbd5e1'
                    }}
                  />
                  {emailError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                      <AlertTriangle size={12} /> {emailError}
                    </div>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" htmlFor="password" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', margin: 0 }}>
                      Password
                    </label>
                    {capsLockActive && (
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        ⚠️ Caps Lock is ON
                      </span>
                    )}
                  </div>

                  <div className="input-wrapper" style={{ position: 'relative' }}>
                    <input 
                      id="password"
                      type={showPassword ? 'text' : 'password'} 
                      className={`form-input ${passwordError ? 'error' : ''}`}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setAccountStatusCheck(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                          setCapsLockActive(true);
                        } else {
                          setCapsLockActive(false);
                        }
                      }}
                      onKeyUp={(e) => {
                        if (e.getModifierState && e.getModifierState('CapsLock')) {
                          setCapsLockActive(true);
                        } else {
                          setCapsLockActive(false);
                        }
                      }}
                      style={{
                        height: '42px',
                        borderRadius: '10px',
                        fontSize: '0.875rem',
                        paddingRight: '40px',
                        border: passwordError ? '1px solid #ef4444' : '1px solid #cbd5e1'
                      }}
                    />
                    <button 
                      type="button" 
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                      <AlertTriangle size={12} /> {passwordError}
                    </div>
                  )}
                  <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.35rem', lineHeight: 1.45 }}>
                    No temporary password yet? Enter your email only, then press Sign In to check your registration approval status.
                  </div>
                </div>

                {accountStatusCheck && (
                  <div
                    style={{
                      borderRadius: '14px',
                      padding: '0.85rem',
                      display: 'grid',
                      gap: '0.65rem',
                      background:
                        accountStatusCheck.kind === 'ready' ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 100%)' :
                        accountStatusCheck.kind === 'pending' ? 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)' :
                        accountStatusCheck.kind === 'rejected' ? 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)' :
                        'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
                      border:
                        accountStatusCheck.kind === 'ready' ? '1px solid #a7f3d0' :
                        accountStatusCheck.kind === 'pending' ? '1px solid #fde68a' :
                        accountStatusCheck.kind === 'rejected' ? '1px solid #fecaca' :
                        '1px solid #bfdbfe',
                      color:
                        accountStatusCheck.kind === 'ready' ? '#065f46' :
                        accountStatusCheck.kind === 'pending' ? '#92400e' :
                        accountStatusCheck.kind === 'rejected' ? '#991b1b' :
                        '#1e3a8a'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '12px',
                          display: 'grid',
                          placeItems: 'center',
                          backgroundColor: 'rgba(255,255,255,0.72)',
                          border: '1px solid rgba(255,255,255,0.9)',
                          flexShrink: 0
                        }}
                      >
                        {accountStatusCheck.kind === 'ready' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.88rem', color: '#0f172a', marginBottom: '0.2rem' }}>
                          {accountStatusCheck.title}
                        </strong>
                        <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.5 }}>
                          {accountStatusCheck.message}
                        </p>
                        {(accountStatusCheck.clinicName || accountStatusCheck.ownerName) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                            {accountStatusCheck.clinicName && (
                              <span style={{ padding: '0.22rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700 }}>
                                Clinic: {accountStatusCheck.clinicName}
                              </span>
                            )}
                            {accountStatusCheck.ownerName && (
                              <span style={{ padding: '0.22rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', fontWeight: 700 }}>
                                Owner: {accountStatusCheck.ownerName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {accountStatusCheck.kind === 'ready' && accountStatusCheck.tempPassword && (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', paddingLeft: '44px' }}>
                        <code style={{ padding: '0.35rem 0.55rem', borderRadius: '9px', backgroundColor: '#ffffff', border: '1px solid #d1fae5', color: '#0f172a', fontSize: '0.76rem', fontWeight: 800 }}>
                          {accountStatusCheck.tempPassword}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(accountStatusCheck.tempPassword || '');
                            showToast('Temporary password copied.', 'success');
                          }}
                          style={{
                            border: '1px solid #99f6e4',
                            backgroundColor: '#0f766e',
                            color: '#ffffff',
                            borderRadius: '9px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.73rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Copy Temp Password
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ borderRadius: '4px' }} />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      fontSize: '0.825rem'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isLoggingIn}
                  style={{
                    height: '42px',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginTop: '0.25rem',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to System</span>
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>

                <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                  <span>Are you registering a new dental clinic? </span>
                  <button 
                    type="button" 
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#2563eb',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                    onClick={() => {
                      setRegPlan('');
                      setCurrentRoute('/register/plan');
                    }}
                  >
                    Register a Clinic
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* FORGOT PASSWORD MODAL */}
          {forgotModalOpen && (
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
              onClick={() => setForgotModalOpen(false)}
            >
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '2rem',
                  maxWidth: '460px',
                  width: '100%',
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                      <LockKeyhole size={18} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Reset Account Password</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {!forgotSubmitted ? (
                  <form onSubmit={handleSendPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                      Enter your registered email address below. We will dispatch a temporary recovery access code to restore your login.
                    </p>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Registered Email
                      </label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. clinicowner@example.com"
                        value={forgotEmailInput}
                        onChange={e => setForgotEmailInput(e.target.value)}
                        style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ height: '36px', width: 'auto', fontSize: '0.825rem' }}
                        onClick={() => setForgotModalOpen(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ height: '36px', width: 'auto', fontSize: '0.825rem' }}
                      >
                        Send Reset Code
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '10px',
                      padding: '1rem',
                      color: '#166534',
                      fontSize: '0.85rem',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        <Check size={16} /> Reset Code Dispatched
                      </div>
                      If an account matches <strong>{forgotEmailInput}</strong>, recovery instructions have been sent.
                    </div>

                    {(() => {
                      const targetUser = mockStorage.getUsers().find(u => u.email.toLowerCase() === forgotEmailInput.toLowerCase());
                      const userPass = targetUser?.passwordHash || 'No record found';
                      return (
                        <div style={{
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                          fontSize: '0.825rem'
                        }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                            Temporary Access Password:
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code style={{
                              flex: 1,
                              backgroundColor: '#ffffff',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              color: '#0f172a'
                            }}>
                              {userPass}
                            </code>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{ height: '32px', width: 'auto', fontSize: '0.75rem' }}
                              onClick={() => copyToClipboard(userPass)}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ height: '38px', width: '100%', fontSize: '0.85rem' }}
                      onClick={() => {
                        const targetUser = mockStorage.getUsers().find(u => u.email.toLowerCase() === forgotEmailInput.toLowerCase());
                        setEmail(forgotEmailInput);
                        if (targetUser?.passwordHash) setPassword(targetUser.passwordHash);
                        setForgotModalOpen(false);
                      }}
                    >
                      Use Credentials & Return to Sign In
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REGISTRATION STEPPER */}
      {currentRoute.startsWith('/register/') && currentRoute !== '/register/success' && !currentRoute.includes('/status/') && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          {/* Top Brand Header */}
          <header style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <FlaskConical size={18} />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>PJ Dental Cloud System</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: '0.5rem', borderLeft: '1px solid #e2e8f0', paddingLeft: '0.75rem' }}>
                Clinic Registration Wizard
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ height: '34px', width: 'auto', padding: '0 0.85rem', fontSize: '0.8rem' }}
                onClick={() => setCurrentRoute('/login')}
              >
                Cancel & Return to Login
              </button>
            </div>
          </header>

          {/* Progress Tracker Ribbon */}
          <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '1.25rem 2rem' }}>
            <div style={{ maxWidth: '980px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              {[
                { r: '/register/plan', step: 1, label: 'Choose Plan' },
                { r: '/register/account', step: 2, label: 'Owner Info' },
                { r: '/register/clinic', step: 3, label: 'Clinic Info' },
                { r: '/register/review', step: 4, label: 'Review Details' },
                { r: '/register/verify-email', step: 5, label: 'Email Verification' },
                { r: '/register/payment', step: 6, label: 'Payment Submission' }
              ].map(s => {
                const isActive = currentRoute === s.r;
                const isCompleted = 
                  (s.step === 1 && regPlan) ||
                  (s.step === 2 && regFirstName && regLastName && regEmail) ||
                  (s.step === 3 && regClinicName && regClinicEmail) ||
                  (s.step === 4 && activeRegistrationId);

                return (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '26px', 
                      height: '26px', 
                      borderRadius: '50%', 
                      backgroundColor: isCompleted ? '#16a34a' : isActive ? '#2563eb' : '#f1f5f9',
                      border: isActive ? '2px solid #2563eb' : isCompleted ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      color: isCompleted || isActive ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {isCompleted ? <Check size={13} /> : s.step}
                    </div>
                    <span style={{
                      fontSize: '0.825rem',
                      fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                      color: isActive ? '#2563eb' : isCompleted ? '#0f172a' : '#64748b'
                    }}>
                      {s.label}
                    </span>
                    {s.step < 6 && <ChevronRight size={13} style={{ color: '#cbd5e1', marginLeft: '0.25rem' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>
            <div style={{
              width: '100%',
              maxWidth: currentRoute === '/register/plan' ? '1080px' : '760px',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '2.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
            }}>
              
              {/* STEP 1: SELECT PLAN */}
              {currentRoute === '/register/plan' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                      Select Your Subscription Plan
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.25rem 0' }}>
                      Choose the right package for your dental clinic scale. You can add branches and upgrade at any time.
                    </p>

                    {/* Billing Cycle Toggle */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      backgroundColor: '#f1f5f9',
                      padding: '4px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <button
                        type="button"
                        onClick={() => setRegBillingCycle('monthly')}
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '7px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: regBillingCycle === 'monthly' ? '#ffffff' : 'transparent',
                          color: regBillingCycle === 'monthly' ? '#0f172a' : '#64748b',
                          boxShadow: regBillingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Monthly Billing
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegBillingCycle('yearly')}
                        style={{
                          padding: '0.35rem 0.9rem',
                          borderRadius: '7px',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          backgroundColor: regBillingCycle === 'yearly' ? '#ffffff' : 'transparent',
                          color: regBillingCycle === 'yearly' ? '#0f172a' : '#64748b',
                          boxShadow: regBillingCycle === 'yearly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span>Annual Billing</span>
                        <span style={{ fontSize: '0.68rem', backgroundColor: '#dcfce7', color: '#16a34a', padding: '0.1rem 0.35rem', borderRadius: '999px', fontWeight: 800 }}>
                          Save 15%
                        </span>
                      </button>
                    </div>
                  </div>

                  {publicRegistrationPlans.length === 0 && (
                    <div className="banner-alert warning" style={{ marginBottom: '1.5rem' }}>
                      No active public plans are currently available for registration.
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {publicRegistrationPlans.map(plan => {
                      const isSelected = regPlan === plan.name;
                      const isRecommended = plan.name.toLowerCase().includes('plus') || plan.name.toLowerCase().includes('max');
                      const finalPrice = regBillingCycle === 'yearly' && plan.monthlyPrice > 0
                        ? Math.round(plan.monthlyPrice * 0.85)
                        : plan.monthlyPrice;

                      return (
                        <div
                          key={plan.id}
                          style={{
                            border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '1.75rem',
                            backgroundColor: isSelected ? '#f8faff' : '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            boxShadow: isSelected ? '0 8px 16px -4px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.04)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isRecommended && (
                            <span style={{
                              position: 'absolute',
                              top: '-11px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.65rem',
                              borderRadius: '999px',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase'
                            }}>
                              ⭐ Most Popular
                            </span>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                              {plan.name} Plan
                            </h3>
                            {isSelected && <Check size={18} color="#2563eb" />}
                          </div>

                          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0', minHeight: '38px', lineHeight: '1.4' }}>
                            {plan.shortDescription}
                          </p>

                          <div style={{ margin: '0.5rem 0 1.25rem 0', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a' }}>
                              {finalPrice > 0 ? `PHP ${finalPrice.toLocaleString()}` : 'Custom Pricing'}
                              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b', marginLeft: '0.3rem' }}>
                                / month {regBillingCycle === 'yearly' && '(billed annually)'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1, marginBottom: '1.5rem' }}>
                            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              Included Features:
                            </span>
                            {plan.features.filter(f => f.enabled).slice(0, 5).map(f => (
                              <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#334155' }}>
                                <Check size={14} color="#16a34a" style={{ flexShrink: 0 }} />
                                <span>{f.label}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                            style={{ width: '100%', height: '40px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px' }}
                            onClick={() => setRegPlan(plan.name)}
                          >
                            {isSelected ? '✓ Plan Selected' : `Select ${plan.name}`}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '42px', padding: '0 1.75rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      disabled={!regPlan}
                      onClick={() => setCurrentRoute('/register/account')}
                    >
                      <span>Continue to Account Info</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ACCOUNT INFO */}
              {currentRoute === '/register/account' && (
                <div>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      Clinic Owner & Administrator Account
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Enter your personal contact details as the primary subscriber and clinic administrator.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          First Name *
                        </label>
                        <input
                          type="text"
                          className={`form-input ${accountFormErrors.firstName ? 'error' : ''}`}
                          placeholder="e.g. Maria"
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        {accountFormErrors.firstName && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{accountFormErrors.firstName}</span>
                        )}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Last Name *
                        </label>
                        <input
                          type="text"
                          className={`form-input ${accountFormErrors.lastName ? 'error' : ''}`}
                          placeholder="e.g. Santos"
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        {accountFormErrors.lastName && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{accountFormErrors.lastName}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          className={`form-input ${accountFormErrors.email ? 'error' : ''}`}
                          placeholder="e.g. clinicowner@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        {accountFormErrors.email && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{accountFormErrors.email}</span>
                        )}
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          className={`form-input ${accountFormErrors.mobile ? 'error' : ''}`}
                          placeholder="e.g. 09538343050"
                          value={regMobile}
                          onChange={(e) => setRegMobile(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                        {accountFormErrors.mobile && (
                          <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{accountFormErrors.mobile}</span>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Personal Residential / Mailing Address *
                      </label>
                      <input
                        type="text"
                        className={`form-input ${accountFormErrors.address ? 'error' : ''}`}
                        placeholder="e.g. Unit 204, MedTower Building, Aguinaldo Highway"
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                      {accountFormErrors.address && (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', display: 'block' }}>{accountFormErrors.address}</span>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          City / Municipality *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Bacoor"
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Province *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Cavite"
                          value={regProvince}
                          onChange={(e) => setRegProvince(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 4102"
                          value={regPostalCode}
                          onChange={(e) => setRegPostalCode(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Legal & Privacy Checkbox Panel */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.825rem', color: '#334155' }}>
                        <input type="checkbox" checked={regTermsAccepted} onChange={(e) => setRegTermsAccepted(e.target.checked)} />
                        <span>I accept the <strong>Terms and Conditions</strong> of Platform Subscription. *</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.825rem', color: '#334155' }}>
                        <input type="checkbox" checked={regPrivacyAccepted} onChange={(e) => setRegPrivacyAccepted(e.target.checked)} />
                        <span>I agree to the <strong>Data Privacy & Protection Policy</strong> (Philippine DPA compliant). *</span>
                      </label>
                      {(accountFormErrors.terms || accountFormErrors.privacy) && (
                        <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Please accept both Terms and Privacy policies to proceed.</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: 'auto', height: '40px', padding: '0 1.25rem', fontSize: '0.85rem' }}
                      onClick={() => setCurrentRoute('/register/plan')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 1.5rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => {
                        if (validateAccountInfo()) setCurrentRoute('/register/clinic');
                      }}
                    >
                      <span>Continue to Clinic Info</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CLINIC INFO */}
              {currentRoute === '/register/clinic' && (
                <div>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      Dental Clinic Details & Capacity
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Provide your main dental facility location, contact points, and initial personnel quotas.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Clinic Facility / Business Name *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Angelo Dental Clinic"
                        value={regClinicName}
                        onChange={(e) => setRegClinicName(e.target.value)}
                        style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Official Clinic Email *
                        </label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="e.g. info@angelodental.com"
                          value={regClinicEmail}
                          onChange={(e) => setRegClinicEmail(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Clinic Contact Landline / Mobile *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 09538343050 / (046) 417-8821"
                          value={regClinicMobile}
                          onChange={(e) => setRegClinicMobile(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Clinic Street Address *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Unit 204, MedTower Building, Aguinaldo Highway"
                        value={regClinicAddress}
                        onChange={(e) => setRegClinicAddress(e.target.value)}
                        style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          City / Municipality *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Bacoor"
                          value={regClinicCity}
                          onChange={(e) => setRegClinicCity(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Province *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Cavite"
                          value={regClinicProvince}
                          onChange={(e) => setRegClinicProvince(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 4102"
                          value={regClinicPostalCode}
                          onChange={(e) => setRegClinicPostalCode(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Initial Personnel and Capacity Numbers */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                          👨‍⚕️ Associate Dentists
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={regDentistsCount}
                          onChange={(e) => setRegDentistsCount(Number(e.target.value))}
                          style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                          👩‍💼 Auxiliary Staff
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={regStaffCount}
                          onChange={(e) => setRegStaffCount(Number(e.target.value))}
                          style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                          🏥 Clinic Branch Locations
                        </label>
                        <input
                          type="number"
                          min={1}
                          className="form-input"
                          value={regLocationsCount}
                          onChange={(e) => setRegLocationsCount(Number(e.target.value))}
                          style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Laboratory Partnership Toggle */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                        <input
                          type="checkbox"
                          checked={regWorksWithLab}
                          onChange={(e) => setRegWorksWithLab(e.target.checked)}
                          style={{ width: '16px', height: '16px' }}
                        />
                        <span>Does your clinic partner with dental laboratories for prosthetic cases?</span>
                      </label>

                      {regWorksWithLab && (
                        <div style={{ marginTop: '0.25rem' }}>
                          <label className="form-label" style={{ fontSize: '0.775rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.35rem' }}>
                            Primary Partner Laboratory Name
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. WeSmile Dental Imaging Center & Lab"
                            value={regLabName}
                            onChange={(e) => setRegLabName(e.target.value)}
                            style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem' }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: 'auto', height: '40px', padding: '0 1.25rem', fontSize: '0.85rem' }}
                      onClick={() => setCurrentRoute('/register/account')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 1.5rem', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      onClick={() => {
                        if (validateClinicInfo()) setCurrentRoute('/register/review');
                      }}
                    >
                      <span>Continue to Review Details</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW DETAILS */}
              {currentRoute === '/register/review' && (
                <div>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      Review Registration & Billing Summary
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Please verify your registration details and subscription order summary before submitting.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Subscription Order Summary Card */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Subscription Plan Order
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px'
                        }}>
                          {regPlan} Plan ({regBillingCycle === 'yearly' ? 'Annual' : 'Monthly'})
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#334155', marginBottom: '0.5rem' }}>
                        <span>Base Subscription Fee ({regBillingCycle === 'yearly' ? '12 Months' : '1 Month'}):</span>
                        <strong style={{ color: '#0f172a' }}>
                          {(() => {
                            const planObj = publicRegistrationPlans.find(p => p.name === regPlan);
                            const price = planObj ? planObj.monthlyPrice : 0;
                            const total = regBillingCycle === 'yearly' ? Math.round(price * 12 * 0.85) : price;
                            return total > 0 ? `PHP ${total.toLocaleString()}` : 'Free / Pending';
                          })()}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', color: '#64748b', marginBottom: '0.75rem' }}>
                        <span>Value Added Tax (12% VAT Included):</span>
                        <span>Included in Net Total</span>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dashed #cbd5e1',
                        paddingTop: '0.75rem',
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}>
                        <span>Total Payable Amount:</span>
                        <span style={{ color: '#2563eb' }}>
                          {(() => {
                            const planObj = publicRegistrationPlans.find(p => p.name === regPlan);
                            const price = planObj ? planObj.monthlyPrice : 0;
                            const total = regBillingCycle === 'yearly' ? Math.round(price * 12 * 0.85) : price;
                            return total > 0 ? `PHP ${total.toLocaleString()}` : 'Free / Pending';
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Summary Matrix: Owner & Clinic */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>
                          👤 Primary Subscriber Details
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: '1.6' }}>
                          <div><strong>Name:</strong> {regFirstName} {regLastName}</div>
                          <div><strong>Email:</strong> {regEmail}</div>
                          <div><strong>Mobile:</strong> {regMobile}</div>
                          <div><strong>Address:</strong> {regAddress}, {regCity}, {regProvince} {regPostalCode}</div>
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.6rem' }}>
                          🏥 Dental Facility Profile
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: '1.6' }}>
                          <div><strong>Clinic Name:</strong> {regClinicName}</div>
                          <div><strong>Email:</strong> {regClinicEmail}</div>
                          <div><strong>Contact:</strong> {regClinicMobile}</div>
                          <div><strong>Personnel Scale:</strong> {regDentistsCount} Dentists, {regStaffCount} Staff, {regLocationsCount} Branch(es)</div>
                          {regWorksWithLab && <div><strong>Lab Partner:</strong> {regLabName || 'Partner Lab Designated'}</div>}
                        </div>
                      </div>
                    </div>

                    {/* Accuracy Declaration */}
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem'
                    }}>
                      <input
                        type="checkbox"
                        id="regDecl"
                        checked={regDeclarationConfirmed}
                        onChange={(e) => setRegDeclarationConfirmed(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="regDecl" style={{ fontSize: '0.825rem', color: '#334155', cursor: 'pointer', margin: 0 }}>
                        I confirm that the clinic and subscriber information stated above are true, accurate, and ready for official verification. *
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: 'auto', height: '40px', padding: '0 1.25rem', fontSize: '0.85rem' }}
                      onClick={() => setCurrentRoute('/register/clinic')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 1.75rem', fontSize: '0.875rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      disabled={!regDeclarationConfirmed}
                      onClick={handleRegistrationSubmit}
                    >
                      <span>Submit Registration</span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: EMAIL VERIFICATION */}
              {currentRoute === '/register/verify-email' && (
                <div style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <Bell size={24} />
                  </div>

                  <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                    Verify Your Email Address
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 1.75rem 0', lineHeight: '1.5' }}>
                    We have dispatched a 6-digit security verification code to <strong>{regEmail}</strong>. Please enter the code below.
                  </p>

                  {otpError && (
                    <div className="banner-alert danger" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      fontSize: '0.825rem',
                      marginBottom: '1.25rem',
                      textAlign: 'left'
                    }}>
                      <AlertTriangle size={16} />
                      <span>{otpError}</span>
                    </div>
                  )}

                  {/* 6-Digit OTP Box Grid */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    {otpFields.map((val, idx) => (
                      <input 
                        key={idx}
                        id={`otp-${idx}`}
                        type="text" 
                        maxLength={1}
                        style={{
                          width: '48px',
                          height: '56px',
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          border: val ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          borderRadius: '10px',
                          backgroundColor: val ? '#eff6ff' : '#ffffff',
                          color: '#0f172a',
                          outline: 'none',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                        }}
                        value={val}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^\d*$/.test(v)) {
                            const next = [...otpFields];
                            next[idx] = v.slice(-1);
                            setOtpFields(next);
                            if (v && idx < 5) {
                              document.getElementById(`otp-${idx + 1}`)?.focus();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otpFields[idx] && idx > 0) {
                            document.getElementById(`otp-${idx - 1}`)?.focus();
                          }
                        }}
                      />
                    ))}
                  </div>

                  {/* Timer & Resend */}
                  <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                    {otpTimer > 0 ? (
                      <span>Security code expires in: <strong style={{ color: '#0f172a' }}>{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong></span>
                    ) : (
                      <button
                        type="button"
                        style={{ border: 'none', background: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={handleResendOtp}
                      >
                        Code expired. Click here to resend security code
                      </button>
                    )}
                  </div>

                  {/* 1-Click Demo OTP Helper */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.75rem',
                    textAlign: 'left'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                        🧪 Development Testing Helper
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#0f172a' }}>
                        Demo Passcode: <strong>{DEMO_OTP}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ height: '30px', width: 'auto', fontSize: '0.75rem', padding: '0 0.6rem' }}
                      onClick={() => {
                        setOtpFields(DEMO_OTP.split(''));
                        showToast("Demo OTP filled!", "info");
                      }}
                    >
                      ⚡ Auto-Fill {DEMO_OTP}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', alignItems: 'center' }}>
                    {otpTimer > 0 ? (
                      <button
                        type="button"
                        style={{ border: 'none', background: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={handleResendOtp}
                      >
                        Resend Code
                      </button>
                    ) : <span />}
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 1.75rem', fontSize: '0.875rem', fontWeight: 700 }}
                      onClick={handleVerifyOtp}
                    >
                      Verify Email & Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: PAYMENT SCREEN */}
              {currentRoute === '/register/payment' && (
                <div>
                  <div style={{ marginBottom: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                      Subscription Payment & Settlement
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                      Choose your preferred payment gateway and submit reference details for administrator clearance.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Amount Due Card */}
                    <div style={{
                      backgroundColor: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.2rem' }}>
                          Total Subscription Amount Due
                        </span>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>
                          {(() => {
                            const planObj = publicRegistrationPlans.find(p => p.name === regPlan);
                            const price = planObj ? planObj.monthlyPrice : 0;
                            const total = regBillingCycle === 'yearly' ? Math.round(price * 12 * 0.85) : price;
                            return total > 0 ? `PHP ${total.toLocaleString()}` : 'PHP 0.00';
                          })()}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        border: '1px solid #93c5fd',
                        color: '#1d4ed8',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '999px'
                      }}>
                        {regPlan} Plan ({regBillingCycle === 'yearly' ? 'Annual' : 'Monthly'})
                      </span>
                    </div>

                    {/* Payment Gateway Cards */}
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                        Select Payment Method
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                        {[
                          { id: 'GCash', label: 'GCash', icon: '🟢', sub: 'Instant E-Wallet' },
                          { id: 'Maya', label: 'Maya', icon: '🟣', sub: 'E-Wallet & QR' },
                          { id: 'Bank Transfer', label: 'Bank Transfer', icon: '🔵', sub: 'BDO / BPI Online' },
                          { id: 'Demo Payment', label: 'Demo Bypass', icon: '⚡', sub: '1-Click Direct Approval' }
                        ].map(m => (
                          <div
                            key={m.id}
                            onClick={() => setPaymentMethod(m.id)}
                            style={{
                              border: paymentMethod === m.id ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              borderRadius: '10px',
                              padding: '0.85rem',
                              backgroundColor: paymentMethod === m.id ? '#f8faff' : '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.2rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '1.1rem' }}>{m.icon}</span>
                              {paymentMethod === m.id && <Check size={16} color="#2563eb" />}
                            </div>
                            <strong style={{ fontSize: '0.85rem', color: '#0f172a', marginTop: '0.25rem' }}>{m.label}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{m.sub}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Account Instructions Box */}
                    {paymentMethod !== 'Demo Payment' && (
                      <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem'
                      }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                          Official Payment Receiving Account:
                        </span>
                        <div style={{ fontSize: '0.85rem', color: '#0f172a', lineHeight: '1.6' }}>
                          {paymentMethod === 'GCash' && (
                            <div>
                              <div><strong>Account Name:</strong> Angelo Mhyr Lagsac</div>
                              <div><strong>GCash Number:</strong> 0953 834 3050</div>
                            </div>
                          )}
                          {paymentMethod === 'Maya' && (
                            <div>
                              <div><strong>Account Name:</strong> Angelo Mhyr Lagsac</div>
                              <div><strong>Maya Number:</strong> 0953 834 3050</div>
                            </div>
                          )}
                          {paymentMethod === 'Bank Transfer' && (
                            <div>
                              <div><strong>Bank:</strong> BDO Unibank Inc. (Current Account)</div>
                              <div><strong>Account Name:</strong> PJ Dental Cloud Solutions</div>
                              <div><strong>Account Number:</strong> 0042 8192 4810</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {paymentMethod !== 'Demo Payment' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                          Official Reference / Transaction Number *
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. 100294829148"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          style={{ height: '40px', borderRadius: '8px', fontSize: '0.85rem' }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', marginTop: '2rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ width: 'auto', height: '40px', padding: '0 1.25rem', fontSize: '0.85rem' }}
                      onClick={() => setCurrentRoute('/register/verify-email')}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: 'auto', height: '40px', padding: '0 1.75rem', fontSize: '0.875rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={handleCompleteDemoPayment}
                    >
                      <span>Complete & Submit Payment</span>
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* STATUS AND SUCCESS PAGES */}
      {currentRoute.includes('/register/status/') && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          <header style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <FlaskConical size={18} />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>PJ Dental Cloud System</span>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              style={{ height: '34px', width: 'auto', padding: '0 0.85rem', fontSize: '0.8rem' }}
              onClick={() => setCurrentRoute('/login')}
            >
              Return to Login
            </button>
          </header>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
            <div style={{
              width: '100%',
              maxWidth: '640px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '2.5rem',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: statusRegistration?.paymentStatus === 'approved' ? '#f0fdf4' : '#eff6ff',
                  color: statusRegistration?.paymentStatus === 'approved' ? '#16a34a' : '#2563eb',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem'
                }}>
                  {statusRegistration?.paymentStatus === 'approved' ? <CheckCircle2 size={28} /> : <History size={28} />}
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  {statusRegistration?.paymentStatus === 'approved' ? 'Registration Approved & Ready' : 'Registration & Clearance Status'}
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  Track the real-time auditing and verification status of your dental clinic registration.
                </p>
              </div>

              {/* 3-Phase Stepper Tracker */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {[
                    { step: 1, label: 'Submitted', done: true },
                    { step: 2, label: 'Audit Review', done: true, current: statusRegistration?.paymentStatus !== 'approved' },
                    { step: 3, label: 'Active Clinic', done: statusRegistration?.paymentStatus === 'approved' }
                  ].map((s) => (
                    <div key={s.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', zIndex: 1 }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: s.done ? (s.current ? '#d97706' : '#16a34a') : '#e2e8f0',
                        color: s.done ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {s.done && !s.current ? <Check size={14} /> : s.step}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.done ? '#0f172a' : '#94a3b8' }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Registration Reference Card */}
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                fontSize: '0.85rem',
                lineHeight: '1.7'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Registration Reference ID:</span>
                  <code style={{ fontWeight: 700, color: '#0f172a' }}>{statusRegistrationId || 'N/A'}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Clinic Facility Name:</span>
                  <strong style={{ color: '#0f172a' }}>{statusRegistration?.clinicName || regClinicName || 'Clinic Registration'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#64748b' }}>Primary Subscriber Email:</span>
                  <span style={{ color: '#0f172a' }}>{statusRegistration?.ownerEmail || regEmail}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#64748b' }}>Current Audit Clearance:</span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: statusRegistration?.paymentStatus === 'approved' ? '#dcfce7' : '#fef3c7',
                    color: statusRegistration?.paymentStatus === 'approved' ? '#166534' : '#92400e',
                    border: statusRegistration?.paymentStatus === 'approved' ? '1px solid #bbf7d0' : '1px solid #fde68a'
                  }}>
                    {statusRegistration?.paymentStatus === 'approved' ? '✓ Approved & Activated' : '⏳ Payment Under Review'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1, height: '40px', fontSize: '0.85rem' }}
                  onClick={() => {
                    const check = mockRegistrationService.getRegistrationById(statusRegistrationId);
                    if (check && check.paymentStatus === 'approved') {
                      showToast("Your account has been approved by Platform Admin!", "success");
                      setCurrentRoute('/register/success');
                    } else {
                      showToast("Status refreshed: Audit clearance is in progress.", "info");
                    }
                  }}
                >
                  <RefreshCw size={15} /> Check / Refresh Status
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, height: '40px', fontSize: '0.85rem' }}
                  onClick={() => setCurrentRoute('/login')}
                >
                  Return to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRATION SUCCESS TEMPORARY PASSWORD REVEAL */}
      {currentRoute === '/register/success' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
          <header style={{
            height: '64px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb'
              }}>
                <FlaskConical size={18} />
              </div>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>PJ Dental Cloud System</span>
            </div>
          </header>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
            <div style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: '#ffffff',
              padding: '2.5rem',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                  Clinic Workspace Ready!
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
                  Your subscription and clinic branches have been provisioned successfully.
                </p>
              </div>

              <div style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.75rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>
                    Registered Login Email:
                  </span>
                  <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                    {statusRegistration?.ownerEmail || regEmail || ''}
                  </strong>
                </div>

                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Temporary Access Password:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{
                      flex: 1,
                      backgroundColor: '#ffffff',
                      padding: '0.45rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#0f172a'
                    }}>
                      {statusRegistration?.tempPassword || 'Awaiting issuance'}
                    </code>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ height: '36px', width: 'auto', fontSize: '0.8rem' }}
                      onClick={() => copyToClipboard(statusRegistration?.tempPassword || '')}
                    >
                      Copy Password
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', display: 'block' }}>
                    ℹ️ For security, you will be prompted to define your personal password upon first sign-in.
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', height: '42px', fontSize: '0.9rem', fontWeight: 700 }}
                onClick={() => setCurrentRoute('/login')}
              >
                Proceed to Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      {['/unauthorized', '/account-suspended', '/maintenance', '/not-found'].includes(currentRoute) && (
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--background)' }}>
          <div className="dashboard-panel" style={{ width: '100%', maxWidth: '520px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: currentRoute === '/account-suspended' ? 'var(--danger)' : 'var(--secondary)', marginBottom: '1rem' }}>
              {currentRoute === '/account-suspended' || currentRoute === '/maintenance' ? <AlertTriangle size={44} /> : <ShieldAlert size={44} />}
            </div>
            <h1 style={{ marginBottom: '0.75rem' }}>
              {currentRoute === '/unauthorized' && 'Unauthorized Access'}
              {currentRoute === '/account-suspended' && 'Account Suspended'}
              {currentRoute === '/maintenance' && (platformSettings.maintenance.title || 'Scheduled Maintenance')}
              {currentRoute === '/not-found' && 'Page Not Found'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {currentRoute === '/unauthorized' && 'This mock account does not have access to the requested workspace.'}
              {currentRoute === '/account-suspended' && 'This prototype account is suspended. Contact platform support in a production build.'}
              {currentRoute === '/maintenance' && (platformSettings.maintenance.message || 'The prototype is temporarily unavailable for maintenance.')}
              {currentRoute === '/not-found' && 'The requested prototype route is not available.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => setCurrentRoute('/login')}>Return to Login</button>
          </div>
        </main>
      )}

      {/* CLINIC OWNER PASSWORD CHANGE RESET ROUTE */}
      {currentRoute === '/clinic/change-password' && (
        <div
          className="login-layout"
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top left, rgba(20, 184, 166, 0.18), transparent 32%), linear-gradient(135deg, #eef7ff 0%, #f8fafc 45%, #eef2ff 100%)',
            padding: '2rem',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '980px',
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(340px, 1.1fr)',
              backgroundColor: '#ffffff',
              border: '1px solid #dbe7f5',
              borderRadius: '28px',
              overflow: 'hidden',
              boxShadow: '0 28px 80px rgba(15, 23, 42, 0.18)'
            }}
          >
            <section
              style={{
                background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 58%, #0f766e 100%)',
                color: '#ffffff',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '560px'
              }}
            >
              <div>
                <div style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '18px',
                  backgroundColor: 'rgba(255, 255, 255, 0.14)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <LockKeyhole size={28} />
                </div>
                <p style={{ margin: '0 0 0.65rem 0', color: '#99f6e4', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                  First-login security
                </p>
                <h1 style={{ margin: 0, fontSize: '2.15rem', lineHeight: 1.08, letterSpacing: '-0.04em' }}>
                  Create your permanent clinic password.
                </h1>
                <p style={{ margin: '1rem 0 0 0', color: '#dbeafe', lineHeight: 1.65, fontSize: '0.98rem' }}>
                  Your temporary password was generated during platform approval. Replace it before entering the clinic owner console.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '0.85rem', marginTop: '2rem' }}>
                {[
                  'Temporary password is verified first.',
                  'New password is saved to the mock auth ledger.',
                  'Platform user reset flags are cleared after success.'
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#e0f2fe', fontSize: '0.9rem' }}>
                    <CheckCircle2 size={18} color="#5eead4" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ padding: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.4rem 0', color: '#2563eb', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    Clinic owner access
                  </p>
                  <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.65rem', letterSpacing: '-0.03em' }}>
                    Secure your account
                  </h2>
                  <p style={{ margin: '0.65rem 0 0 0', color: '#64748b', lineHeight: 1.55 }}>
                    Signed in as <strong style={{ color: '#0f172a' }}>{loggedUserEmail || 'clinic owner'}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleCancelPasswordChange}
                  disabled={isChangingPassword}
                  style={{ width: '42px', height: '42px', padding: 0, borderRadius: '14px' }}
                  aria-label="Return to login"
                >
                  <X size={18} />
                </button>
              </div>

              {passwordChangeError && (
                <div
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    padding: '0.95rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '16px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff1f2',
                    color: '#991b1b',
                    fontSize: '0.9rem',
                    lineHeight: 1.45
                  }}
                >
                  <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <span>{passwordChangeError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={tempPasswordInput}
                    onChange={(e) => setTempPasswordInput(e.target.value)}
                    placeholder="Enter platform-issued temporary password"
                    autoComplete="current-password"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="At least 8 characters with letters and numbers"
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                  />
                </div>

                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1rem',
                    color: '#475569',
                    fontSize: '0.86rem',
                    lineHeight: 1.55
                  }}
                >
                  Password must be different from the temporary password. After saving, the system clears the first-login reset flag and opens the clinic dashboard.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCancelPasswordChange}
                    disabled={isChangingPassword}
                    style={{ width: 'auto', minWidth: '132px' }}
                  >
                    Return to Login
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isChangingPassword}
                    style={{ width: 'auto', minWidth: '220px' }}
                  >
                    {isChangingPassword ? 'Updating Password...' : 'Change Password & Continue'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      {/* DASHBOARD AND INTERNAL PANELS */}
      {currentRoute !== '/login' && !currentRoute.startsWith('/register/') && currentRoute !== '/clinic/change-password' && !['/unauthorized', '/account-suspended', '/maintenance', '/not-found'].includes(currentRoute) && (
        currentRoute.startsWith('/clinic/') && isSubscriptionLocked ? (
          <SubscriptionLockedScreen
            subscription={activeSubscription}
            clinicName={loggedClinicName || subscriberRecord?.businessName || 'Dental Clinic'}
            userEmail={loggedUserEmail || subscriberRecord?.email || ''}
            userName={loggedUserName || 'Clinic Owner'}
            onLogout={handleLogoutConfirm}
            showToast={showToast}
          />
        ) : currentRoute.startsWith('/associate/workspace') || currentRoute.startsWith('/staff/workspace') ? (
          <RoleConsoleLayout
            role={currentRoute.startsWith('/associate/') ? 'associate' : 'staff'}
            currentRoute={currentRoute}
            loggedUserName={loggedUserName}
            loggedClinicName={loggedClinicName}
            loggedPlanName={loggedPlanName}
            loggedUserEmail={loggedUserEmail}
            isRefreshing={isRefreshing}
            onRefresh={triggerRefresh}
            onLogout={handleLogoutConfirm}
            onNavigate={(route) => setCurrentRoute(route)}
          >
            <RoleWorkspacePage
              role={currentRoute.startsWith('/associate/') ? 'associate' : 'staff'}
              name={loggedUserName}
              email={loggedUserEmail}
              clinicIds={assignedClinicIds}
              linkedRecordId={authenticatedRoleUser?.linkedRecordId}
              onOpenClinic={(clinicId) => setCurrentRoute(`/clinic/${clinicId}/dashboard`)}
              clinicName={loggedClinicName}
              planName={loggedPlanName}
              currentRoute={currentRoute}
            />
          </RoleConsoleLayout>
        ) : isOwnerMasterFileRoute ? (
          <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <h2>Master File Directory Moved</h2>
            <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '520px' }}>
              The clinic owner console no longer opens a shared Master File Directory. Master files now live inside each clinic branch workspace to keep branch data isolated.
            </p>
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute('/clinic/dashboard')}>
              Return to Clinic Dashboard
            </button>
          </div>
        ) : isSubsystemRoute ? (
          !currentClinic ? (
            <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <h2>Clinic Not Found</h2>
              <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '420px' }}>
                The clinic workspace you are trying to access does not exist.
              </p>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute('/clinic/dashboard')}>
                Return to Clinic Dashboard
              </button>
            </div>
          ) : currentClinic.status !== 'active' ? (
            <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <h2>Access Restricted</h2>
              <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '420px' }}>
                This clinic branch status is currently inactive. Please contact the administrator.
              </p>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute('/clinic/dashboard')}>
                Return to Clinic Dashboard
              </button>
            </div>
          ) : currentRoute.startsWith(`/clinic/${currentClinic.id}/master-files`) ? (
            <MasterFileDirectoryLayout
              currentRoute={currentRoute}
              loggedUserName={loggedUserName}
              loggedUserEmail={loggedUserEmail}
              onLogout={() => {
                showToast('Exited clinic branch operational workspace.', 'info');
                setCurrentRoute(userRole === 'clinic_owner' ? '/clinic/dashboard' : `/${userRole}/workspace`);
              }}
              onNavigate={setCurrentRoute}
              showToast={showToast}
              currentClinic={currentClinic}
            >
              {renderMasterFileDirectoryContent(`/clinic/${currentClinic.id}/master-files`, currentClinic)}
            </MasterFileDirectoryLayout>
          ) : (
            <ClinicWorkspaceLayout
              currentRoute={currentRoute}
              loggedUserName={loggedUserName}
              loggedUserEmail={loggedUserEmail}
              onLogout={() => {
                showToast('Exited clinic branch operational workspace.', 'info');
                setCurrentRoute(userRole === 'clinic_owner' ? '/clinic/dashboard' : `/${userRole}/workspace`);
              }}
              onNavigate={handleSidebarClick}
              showToast={showToast}
              currentClinic={currentClinic}
              role={userRole === 'associate' || userRole === 'staff' ? userRole : 'clinic_owner'}
              permissions={authenticatedRoleUser?.privileges}
            >
              {currentRoute === `/clinic/${currentClinic.id}/dashboard` ? (
                <ClinicDashboardPage
                  currentClinic={currentClinic}
                  loggedUserName={loggedUserName}
                  showToast={showToast}
                  role={userRole === 'associate' || userRole === 'staff' ? userRole : 'clinic_owner'}
                />
              ) : currentRoute === `/clinic/${currentClinic.id}/patients` ? (
                <PatientsPage
                  currentClinic={currentClinic}
                  loggedUserName={loggedUserName}
                  showToast={showToast}
                  canEditPatients={userRole === 'clinic_owner' || authenticatedRoleUser?.privileges?.editPatientData !== false}
                  canDeletePatients={userRole === 'clinic_owner' || authenticatedRoleUser?.privileges?.canDeletePatients === true}
                />
              ) : currentRoute === `/clinic/${currentClinic.id}/calendar` ? (
                <ClinicSchedulingLayout
                  currentRoute={currentRoute}
                  currentClinic={currentClinic}
                  onNavigate={(route) => setCurrentRoute(route)}
                >
                  <SchedulingCalendarPage
                    currentClinic={currentClinic}
                    onReturnToDashboard={() => setCurrentRoute(`/clinic/${currentClinic.id}/dashboard`)}
                    showToast={showToast}
                    canManageAppointments={userRole === 'clinic_owner' || userRole === 'staff' || authenticatedRoleUser?.privileges?.viewAppointments !== false}
                  />
                </ClinicSchedulingLayout>
              ) : currentRoute === `/clinic/${currentClinic.id}/waitlist` ? (
                <ClinicSchedulingLayout
                  currentRoute={currentRoute}
                  currentClinic={currentClinic}
                  onNavigate={(route) => setCurrentRoute(route)}
                >
                  <SchedulingWaitlistPage
                    currentClinic={currentClinic}
                    onReturnToDashboard={() => setCurrentRoute(`/clinic/${currentClinic.id}/dashboard`)}
                  />
                </ClinicSchedulingLayout>
              ) : currentRoute === `/clinic/${currentClinic.id}/analytics` || currentRoute === `/clinic/${currentClinic.id}/analytics/overview` ? (
                <AnalyticsOverviewPage
                  currentRoute={currentRoute}
                  currentClinic={currentClinic}
                  onNavigate={setCurrentRoute}
                />
              ) : currentRoute === `/clinic/${currentClinic.id}/analytics/daily` ? (
                <AnalyticsDailyPage
                  currentRoute={currentRoute}
                  currentClinic={currentClinic}
                  onNavigate={setCurrentRoute}
                />
              ) : currentRoute === `/clinic/${currentClinic.id}/settings` ? (
                <SettingsPage
                  currentClinic={currentClinic}
                  showToast={showToast}
                  onReturnToDashboard={() => setCurrentRoute(`/clinic/${currentClinic.id}/dashboard`)}
                />
              ) : (
                <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                  <h2>{activeModule} Module</h2>
                  <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '420px' }}>
                    This operational clinic subsystem feature is currently under development.
                  </p>
                  <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute(`/clinic/${currentClinic.id}/dashboard`)}>
                    Return to Branch Dashboard
                  </button>
                </div>
              )}
            </ClinicWorkspaceLayout>
          )
        ) : userRole !== 'platform_owner' ? (
          <ClinicOwnerLayout
            currentRoute={currentRoute}
            loggedUserName={loggedUserName}
            loggedClinicName={loggedClinicName}
            loggedPlanName={loggedPlanName}
            loggedUserEmail={loggedUserEmail}
            isRefreshing={isRefreshing}
            onRefresh={triggerRefresh}
            onLogout={() => setLogoutModalOpen(true)}
            onNavigate={handleSidebarClick}
            onResetMock={() => setResetMockModalOpen(true)}
          >
            {currentRoute === '/clinic/dashboard' ? (
              <ClinicOwnerDashboardPage
                loggedUserName={loggedUserName}
                loggedClinicName={loggedClinicName}
                loggedPlanName={loggedPlanName}
                showToast={showToast}
                onEnterBranch={(clinicId, branchName) => {
                  showToast(`Entering ${branchName} operational workspace...`, 'success');
                  setCurrentRoute(`/clinic/${clinicId}/dashboard`);
                }}
                loggedUserEmail={loggedUserEmail}
              />
            ) : currentRoute === '/clinic/profile' ? (
              <ClinicProfilePage
                loggedClinicName={loggedClinicName}
                loggedPlanName={loggedPlanName}
                showToast={showToast}
              />
            ) : currentRoute === '/clinic/branches' ? (
              <ClinicBranchesPage
                loggedClinicName={loggedClinicName}
                showToast={showToast}
                loggedUserEmail={loggedUserEmail}
                onAddBranch={() => setCurrentRoute('/clinic/branches/new')}
                onViewBranch={(clinicId) => setCurrentRoute(`/clinic/branches/view/${clinicId}`)}
                onEditBranch={(clinicId) => setCurrentRoute(`/clinic/branches/edit/${clinicId}`)}
                onEnterBranch={(clinicId, branchName) => {
                  showToast(`Entering ${branchName} operational workspace...`, 'success');
                  setCurrentRoute(`/clinic/${clinicId}/dashboard`);
                }}
              />
            ) : currentRoute === '/clinic/branches/new' ? (
              <ClinicBranchCreatePage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onBack={() => setCurrentRoute('/clinic/branches')}
              />
            ) : currentRoute.startsWith('/clinic/branches/view/') ? (
              <ClinicBranchCreatePage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="view"
                branchId={currentRoute.replace('/clinic/branches/view/', '')}
                onBack={() => setCurrentRoute('/clinic/branches')}
              />
            ) : currentRoute.startsWith('/clinic/branches/edit/') ? (
              <ClinicBranchCreatePage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="edit"
                branchId={currentRoute.replace('/clinic/branches/edit/', '')}
                onBack={() => setCurrentRoute('/clinic/branches')}
              />
            ) : currentRoute === '/clinic/laboratories' ? (
              <ClinicLaboratoriesPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onAddLaboratory={() => setCurrentRoute('/clinic/laboratories/new')}
                onViewLaboratory={(laboratoryId) => setCurrentRoute(`/clinic/laboratories/view/${laboratoryId}`)}
                onEditLaboratory={(laboratoryId) => setCurrentRoute(`/clinic/laboratories/edit/${laboratoryId}`)}
              />
            ) : currentRoute === '/clinic/laboratories/new' ? (
              <ClinicLaboratoryFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onBack={() => setCurrentRoute('/clinic/laboratories')}
              />
            ) : currentRoute.startsWith('/clinic/laboratories/edit/') ? (
              <ClinicLaboratoryFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="edit"
                laboratoryId={currentRoute.replace('/clinic/laboratories/edit/', '')}
                onBack={() => setCurrentRoute('/clinic/laboratories')}
              />
            ) : currentRoute.startsWith('/clinic/laboratories/view/') ? (
              <LaboratoryDetailsPage
                laboratoryId={currentRoute.replace('/clinic/laboratories/view/', '')}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
                navigate={(route) => {
                  if (route === '/platform/laboratories') {
                    setCurrentRoute('/clinic/laboratories');
                    return;
                  }
                  if (route.startsWith('/platform/laboratories/') && route.endsWith('/edit')) {
                    const laboratoryId = route.replace('/platform/laboratories/', '').replace('/edit', '');
                    setCurrentRoute(`/clinic/laboratories/edit/${laboratoryId}`);
                    return;
                  }
                  if (route.startsWith('/platform/laboratories/')) {
                    const laboratoryId = route.replace('/platform/laboratories/', '');
                    setCurrentRoute(`/clinic/laboratories/view/${laboratoryId}`);
                    return;
                  }
                  setCurrentRoute(route);
                }}
              />
            ) : currentRoute === '/clinic/dentists' ? (
              <AssociateDentistsPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onAddDentist={() => setCurrentRoute('/clinic/dentists/new')}
                onViewDentist={(dentistId) => setCurrentRoute(`/clinic/dentists/view/${dentistId}`)}
                onEditDentist={(dentistId) => setCurrentRoute(`/clinic/dentists/edit/${dentistId}`)}
              />
            ) : currentRoute === '/clinic/dentists/new' ? (
              <AssociateDentistFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onBack={() => setCurrentRoute('/clinic/dentists')}
              />
            ) : currentRoute.startsWith('/clinic/dentists/view/') ? (
              <AssociateDentistFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="view"
                dentistId={currentRoute.replace('/clinic/dentists/view/', '')}
                onBack={() => setCurrentRoute('/clinic/dentists')}
              />
            ) : currentRoute.startsWith('/clinic/dentists/edit/') ? (
              <AssociateDentistFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="edit"
                dentistId={currentRoute.replace('/clinic/dentists/edit/', '')}
                onBack={() => setCurrentRoute('/clinic/dentists')}
              />
            ) : currentRoute === '/clinic/staff' ? (
              <StaffManagementPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onAddStaff={() => setCurrentRoute('/clinic/staff/new')}
                onViewStaff={(staffId) => setCurrentRoute(`/clinic/staff/view/${staffId}`)}
                onEditStaff={(staffId) => setCurrentRoute(`/clinic/staff/edit/${staffId}`)}
              />
            ) : currentRoute === '/clinic/staff/new' ? (
              <StaffFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                onBack={() => setCurrentRoute('/clinic/staff')}
              />
            ) : currentRoute.startsWith('/clinic/staff/view/') ? (
              <StaffFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="view"
                staffId={currentRoute.replace('/clinic/staff/view/', '')}
                onBack={() => setCurrentRoute('/clinic/staff')}
              />
            ) : currentRoute.startsWith('/clinic/staff/edit/') ? (
              <StaffFormPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
                mode="edit"
                staffId={currentRoute.replace('/clinic/staff/edit/', '')}
                onBack={() => setCurrentRoute('/clinic/staff')}
              />
            ) : currentRoute === '/clinic/analytics' ? (
              <ClinicAnalyticsPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
              />
            ) : currentRoute === '/clinic/sales' ? (
              <SalesOverviewPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
              />
            ) : currentRoute === '/clinic/daily-reports' ? (
              <DailyReportsPage
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                showToast={showToast}
              />
            ) : currentRoute === '/clinic/settings' ? (
              <GeneralSettingsPage
                loggedPlanName={loggedPlanName}
                loggedClinicName={loggedClinicName}
                loggedUserEmail={loggedUserEmail}
                loggedUserName={loggedUserName}
                showToast={showToast}
              />
            ) : (
              <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                <div className="under-dev-icon-wrapper" style={{ margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'center', color: 'var(--secondary)' }}>
                  <Settings size={48} />
                </div>
                <h2>{activeModule} Module</h2>
                <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '420px' }}>
                  This clinic management module is under development and will be connected in a future release.
                </p>
                <span className="badge-prototype" style={{ display: 'inline-block', marginBottom: '1.5rem' }}><ShieldAlert size={12} /> Prototype Mode Only</span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute('/clinic/dashboard')}>
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}
          </ClinicOwnerLayout>
        ) : (
          <div className="dashboard-layout">
          {/* Sidebar */}
          <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`} aria-label="Sidebar navigation">
            <div className="sidebar-header">
              <div 
                className="sidebar-brand" 
                onClick={() => handleSidebarClick('Dashboard', userRole === 'platform_owner' ? '/platform/dashboard' : '/clinic/dashboard')} 
                style={{ cursor: 'pointer' }}
              >
                <FlaskConical size={28} className="sidebar-logo" />
                <span className="sidebar-brand-name">
                  {userRole === 'platform_owner' ? 'Platform Admin' : 'Clinic Console'}
                </span>
              </div>
              <button 
                className="sidebar-collapse-btn" 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu size={18} />
              </button>
            </div>

            <nav className="sidebar-nav" aria-label="Primary Platform Navigation">
              {userRole === 'platform_owner' ? (
                <>
                  {/* 1. OVERVIEW SECTION */}
                  <div className="sidebar-section">
                    <button
                      type="button"
                      className="sidebar-section-header"
                      onClick={() => togglePlatformSection('overview')}
                      title={sidebarCollapsed ? "Overview" : undefined}
                    >
                      <span className="sidebar-section-title">Overview</span>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={14}
                          style={{
                            transform: platformSidebarOpenSections.overview ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                            opacity: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                    {(platformSidebarOpenSections.overview || sidebarCollapsed) && (
                      <div className="sidebar-section-items">
                        <button 
                          className={`sidebar-link ${currentRoute === '/platform/dashboard' ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Dashboard', '/platform/dashboard')}
                          title={sidebarCollapsed ? "Dashboard" : undefined}
                        >
                          <LayoutDashboard size={18} />
                          <span className="sidebar-link-text">Dashboard</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 2. CLIENT ACCOUNTS SECTION */}
                  <div className="sidebar-section">
                    <button
                      type="button"
                      className="sidebar-section-header"
                      onClick={() => togglePlatformSection('subscriber_management')}
                      title={sidebarCollapsed ? "Clinic Accounts" : undefined}
                    >
                      <span className="sidebar-section-title">Clinic Accounts</span>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={14}
                          style={{
                            transform: platformSidebarOpenSections.subscriber_management ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                            opacity: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                    {(platformSidebarOpenSections.subscriber_management || sidebarCollapsed) && (
                      <div className="sidebar-section-items">
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/subscribers') || currentRoute.startsWith('/platform/registrations') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Clinic Owners', '/platform/subscribers')}
                          title={sidebarCollapsed ? "Clinic Owners" : undefined}
                        >
                          <Users size={18} />
                          <span className="sidebar-link-text">Clinic Owners</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/users') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Clinic Staff & Doctors', '/platform/users')}
                          title={sidebarCollapsed ? "Clinic Staff & Doctors" : undefined}
                        >
                          <UserSquare2 size={18} />
                          <span className="sidebar-link-text">Clinic Staff & Doctors</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. CLINICS & LABORATORIES SECTION */}
                  <div className="sidebar-section">
                    <button
                      type="button"
                      className="sidebar-section-header"
                      onClick={() => togglePlatformSection('facilities_management')}
                      title={sidebarCollapsed ? "Clinics & Laboratories" : undefined}
                    >
                      <span className="sidebar-section-title">Clinics & Laboratories</span>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={14}
                          style={{
                            transform: platformSidebarOpenSections.facilities_management ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                            opacity: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                    {(platformSidebarOpenSections.facilities_management || sidebarCollapsed) && (
                      <div className="sidebar-section-items">
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/clinics') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Dental Clinics', '/platform/clinics')}
                          title={sidebarCollapsed ? "Dental Clinics" : undefined}
                        >
                          <Building2 size={18} />
                          <span className="sidebar-link-text">Dental Clinics</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/laboratories') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Partner Laboratories', '/platform/laboratories')}
                          title={sidebarCollapsed ? "Partner Laboratories" : undefined}
                        >
                          <FlaskConical size={18} />
                          <span className="sidebar-link-text">Partner Laboratories</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 4. PLANS & BILLING SECTION */}
                  <div className="sidebar-section">
                    <button
                      type="button"
                      className="sidebar-section-header"
                      onClick={() => togglePlatformSection('subscription_management')}
                      title={sidebarCollapsed ? "Plans & Billing" : undefined}
                    >
                      <span className="sidebar-section-title">Plans & Billing</span>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={14}
                          style={{
                            transform: platformSidebarOpenSections.subscription_management ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                            opacity: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                    {(platformSidebarOpenSections.subscription_management || sidebarCollapsed) && (
                      <div className="sidebar-section-items">
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/plans') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Subscription Plans', '/platform/plans')}
                          title={sidebarCollapsed ? "Subscription Plans" : undefined}
                        >
                          <Layers size={18} />
                          <span className="sidebar-link-text">Subscription Plans</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/subscriptions') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Active Subscriptions', '/platform/subscriptions')}
                          title={sidebarCollapsed ? "Active Subscriptions" : undefined}
                        >
                          <CreditCard size={18} />
                          <span className="sidebar-link-text">Active Subscriptions</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/payments') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Payments & Receipts', '/platform/payments')}
                          title={sidebarCollapsed ? "Payments & Receipts" : undefined}
                        >
                          <DollarSign size={18} />
                          <span className="sidebar-link-text">Payments & Receipts</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 5. SYSTEM & TOOLS SECTION */}
                  <div className="sidebar-section">
                    <button
                      type="button"
                      className="sidebar-section-header"
                      onClick={() => togglePlatformSection('system')}
                      title={sidebarCollapsed ? "System & Tools" : undefined}
                    >
                      <span className="sidebar-section-title">System & Tools</span>
                      {!sidebarCollapsed && (
                        <ChevronDown
                          size={14}
                          style={{
                            transform: platformSidebarOpenSections.system ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s ease',
                            opacity: 0.8,
                            flexShrink: 0
                          }}
                        />
                      )}
                    </button>
                    {(platformSidebarOpenSections.system || sidebarCollapsed) && (
                      <div className="sidebar-section-items">
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/analytics-reports') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Reports & Analytics', '/platform/analytics-reports')}
                          title={sidebarCollapsed ? "Reports & Analytics" : undefined}
                        >
                          <BarChart3 size={18} />
                          <span className="sidebar-link-text">Reports & Analytics</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/announcements') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Announcements & Notices', '/platform/announcements')}
                          title={sidebarCollapsed ? "Announcements & Notices" : undefined}
                        >
                          <Megaphone size={18} />
                          <span className="sidebar-link-text">Announcements & Notices</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/audit-logs') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Activity History', '/platform/audit-logs')}
                          title={sidebarCollapsed ? "Activity History" : undefined}
                        >
                          <History size={18} />
                          <span className="sidebar-link-text">Activity History</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/data-restore') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Backup & Recovery', '/platform/data-restore')}
                          title={sidebarCollapsed ? "Backup & Recovery" : undefined}
                        >
                          <Database size={18} />
                          <span className="sidebar-link-text">Backup & Recovery</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/notifications') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('Alerts & Notifications', '/platform/notifications')}
                          title={sidebarCollapsed ? "Alerts & Notifications" : undefined}
                        >
                          <Bell size={18} />
                          <span className="sidebar-link-text">Alerts & Notifications</span>
                        </button>
                        <button 
                          className={`sidebar-link ${currentRoute.startsWith('/platform/settings') ? 'active' : ''}`} 
                          onClick={() => handleSidebarClick('System Settings', '/platform/settings')}
                          title={sidebarCollapsed ? "System Settings" : undefined}
                        >
                          <Settings size={18} />
                          <span className="sidebar-link-text">System Settings</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="sidebar-section">
                    <span className="sidebar-section-title">Main Hub</span>
                    <button 
                      className={`sidebar-link ${activeModule === 'Dashboard' ? 'active' : ''}`} 
                      onClick={() => handleSidebarClick('Dashboard', '/clinic/dashboard')}
                      title={sidebarCollapsed ? "Dashboard" : undefined}
                    >
                      <LayoutDashboard size={18} />
                      <span className="sidebar-link-text">Dashboard</span>
                    </button>
                  </div>
                </>
              )}
            </nav>

            <div className="sidebar-footer">
              <button 
                className="sidebar-link warning" 
                style={{ border: '1px solid rgba(255,255,255,0.1)', padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }} 
                onClick={() => setResetMockModalOpen(true)}
                title="Reset Mock Data"
              >
                <RotateCcw size={18} />
                <span className="sidebar-link-text">Reset Mock Data</span>
              </button>
              <button 
                className="sidebar-link danger" 
                style={{ padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
                onClick={() => setLogoutModalOpen(true)}
                title="Sign Out"
              >
                <LogOut size={18} />
                <span className="sidebar-link-text">Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Wrapper */}
          <div className="main-wrapper">
            <header className="top-nav">
              <div className="top-nav-left">
                <button className="hamburger-btn" onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}><Menu size={20} /></button>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{userRole === 'platform_owner' ? 'Platform Administration System' : 'Clinic Console'}</h3>
              </div>
              <div className="top-nav-right">
                <span className="badge-prototype"><ShieldAlert size={12} /> Prototype Mode</span>
                {userRole === 'platform_owner' && (
                  <button
                    className="top-nav-btn"
                    onClick={() => setStaleSafePurgeModalOpen(true)}
                    title="Stale-Safe Purge"
                    style={{
                      width: 'auto',
                      paddingInline: '0.9rem',
                      gap: '0.45rem',
                      color: '#dc2626',
                      borderColor: '#fecaca',
                      background: '#fff5f5',
                      fontWeight: 700
                    }}
                  >
                    <Database size={16} />
                    <span>Stale-Safe Purge</span>
                  </button>
                )}
                <button className="top-nav-btn" onClick={triggerRefresh}>
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
                </button>
                <NotificationBell navigate={setCurrentRoute} showToast={showToast} />
                <div className="profile-menu-container">
                  <button className="profile-trigger" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                    <div className="profile-avatar">{loggedUserName.slice(0, 1)}</div>
                  </button>
                  {profileDropdownOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-dropdown-header">
                        <p className="profile-name">{loggedUserName}</p>
                        <p className="profile-email">{loggedUserEmail}</p>
                      </div>
                      <button className="profile-dropdown-item danger" onClick={handleLogoutConfirm}><LogOut size={14} /> Sign Out</button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            <GlobalAnnouncementBanner
              userId={userRole === 'platform_owner' ? 'usr-admin-1' : 'usr-dentist-1'}
              userRole={userRole}
              currentRoute={currentRoute}
              onNavigate={setCurrentRoute}
              showToast={showToast}
            />

            {/* PLATFORM OWNER DASHBOARD */}
            {currentRoute === '/platform/dashboard' && (
              <PlatformDashboardPage
                navigate={setCurrentRoute}
                showToast={showToast}
                onReviewRegistration={(reg) => {
                  setSelectedRegAdmin(reg);
                  setCurrentRoute(`/platform/registrations/${reg.id}`);
                }}
                registrations={registrations}
                dashboardAnalytics={dashboardAnalytics}
                subscriptionSummary={subscriptionSummary}
                clinicSummary={clinicSummary}
                laboratorySummary={laboratorySummary}
                paymentSummary={paymentSummary}
                notificationSummary={notificationSummary}
                announcementSummary={announcementSummary}
                auditSummary={auditSummary}
                platformSettings={platformSettings}
                backupSummary={backupSummary}
                computedPendingPayments={computedPendingPayments}
                activityLogs={mockStorage.getActivityLogs()}
                refreshShell={syncStateFromStorage}
                onShowProvisionModal={handleShowProvisionSuccess}
              />
            )}

            {/* SUBSCRIBER MANAGEMENT MODULE */}
            {(currentRoute === '/platform/subscribers' || currentRoute === '/platform/registrations') && (
              <SubscribersPage
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
                onShowProvisionModal={handleShowProvisionSuccess}
              />
            )}

            {currentRoute.startsWith('/platform/subscribers/') && (
              <SubscriberDetailsPage
                subscriberId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* PLATFORM OWNER - REGISTRATION DETAILS PAGE */}
            {currentRoute.startsWith('/platform/registrations/') && selectedRegistrationForRoute && (
              <main className="main-content">
                <button className="forgot-password-link" style={{ border: 'none', background: 'none', cursor: 'pointer', marginBottom: '1rem' }} onClick={() => setCurrentRoute('/platform/subscribers')}>← Back to Subscribers</button>
                <h2>Registration Review: {selectedRegistrationForRoute.id}</h2>
                <div className="sections-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="dashboard-panel" style={{ margin: 0 }}>
                    <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Subscriber Details</h3>
                    <p><strong>Owner Name:</strong> {selectedRegistrationForRoute.ownerName}</p>
                    <p><strong>Clinic:</strong> {selectedRegistrationForRoute.clinicName} ({selectedRegistrationForRoute.clinicAddress})</p>
                    <p><strong>Plan Chosen:</strong> {selectedRegistrationForRoute.plan}</p>
                    <p><strong>Email Status:</strong> {selectedRegistrationForRoute.emailVerified ? 'Verified' : 'Pending'}</p>
                    <p><strong>Payment Reference:</strong> {selectedRegistrationForRoute.referenceNumber || 'None'}</p>
                    <p><strong>Payment Method:</strong> {selectedRegistrationForRoute.paymentMethod || 'None'}</p>
                  </div>

                  <div className="dashboard-panel" style={{ margin: 0 }}>
                    <h3>Administrative Actions</h3>
                    {(selectedRegistrationForRoute.paymentStatus === 'pending_verification' || selectedRegistrationForRoute.registrationStatus === 'payment_under_review') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className="btn btn-primary" onClick={() => {
                          setSelectedRegAdmin(selectedRegistrationForRoute);
                          setApprovePaymentModalOpen(true);
                        }}>Approve Payment & Provision Account</button>
                        <button className="btn btn-secondary" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)' }} onClick={() => {
                          setSelectedRegAdmin(selectedRegistrationForRoute);
                          setRejectPaymentModalOpen(true);
                        }}>Reject Payment</button>
                      </div>
                    )}
                    {selectedRegistrationForRoute.paymentStatus === 'approved' && (
                      <div className="banner-alert success" style={{ marginTop: '1rem' }}>
                        <strong>APPROVED</strong>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Temp Pass: <code>{selectedRegistrationForRoute.tempPassword}</code></p>
                      </div>
                    )}
                  </div>
                </div>
              </main>
            )}

            {/* USER MANAGEMENT MODULE */}
            {currentRoute === '/platform/users' && (
              <UsersPage
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {currentRoute.startsWith('/platform/users/') && (
              <UserDetailsPage
                userId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* PLANS COMPONENT */}
            {currentRoute === '/platform/plans' && (
              <PlansPage
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute === '/platform/plans/new' && (
              <PlanFormPage
                mode="create"
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/plans/') && currentRoute.endsWith('/edit') && (
              <PlanFormPage
                mode="edit"
                planId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/plans/') && currentRoute !== '/platform/plans/new' && !currentRoute.endsWith('/edit') && (
              <PlanDetailsPage
                planId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* SUBSCRIPTIONS COMPONENT */}
            {currentRoute === '/platform/subscriptions' && (
              <SubscriptionsPage
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute === '/platform/subscriptions/new' && (
              <SubscriptionFormPage
                mode="create"
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/subscriptions/') && currentRoute.endsWith('/edit') && (
              <SubscriptionFormPage
                mode="edit"
                subscriptionId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/subscriptions/') && currentRoute !== '/platform/subscriptions/new' && !currentRoute.endsWith('/edit') && (
              <SubscriptionDetailsPage
                subscriptionId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* PAYMENTS COMPONENT */}
            {currentRoute === '/platform/payments' && (
              <PaymentsPage
                navigate={setCurrentRoute}
                showToast={showToast}
                onShowProvisionModal={handleShowProvisionSuccess}
              />
            )}

            {currentRoute === '/platform/payments/new' && (
              <PaymentFormPage
                mode="create"
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/payments/') && currentRoute.endsWith('/edit') && (
              <PaymentFormPage
                mode="edit"
                paymentId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/payments/') && currentRoute !== '/platform/payments/new' && !currentRoute.endsWith('/edit') && (
              <PaymentDetailsPage
                paymentId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* CLINICS COMPONENT */}
            {currentRoute === '/platform/clinics' && (
              <ClinicsPage
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {currentRoute === '/platform/clinics/new' && (
              <ClinicFormPage
                mode="create"
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/clinics/') && currentRoute.endsWith('/edit') && (
              <ClinicFormPage
                mode="edit"
                clinicId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/clinics/') && currentRoute !== '/platform/clinics/new' && !currentRoute.endsWith('/edit') && (
              <ClinicDetailsPage
                clinicId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {/* LABORATORIES COMPONENT */}
            {currentRoute === '/platform/laboratories' && (
              <LaboratoriesPage
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {currentRoute === '/platform/laboratories/new' && (
              <LaboratoryFormPage
                mode="create"
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/laboratories/') && currentRoute.endsWith('/edit') && (
              <LaboratoryFormPage
                mode="edit"
                laboratoryId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/laboratories/') && currentRoute !== '/platform/laboratories/new' && !currentRoute.endsWith('/edit') && (
              <LaboratoryDetailsPage
                laboratoryId={decodeURIComponent(currentRoute.split('/').pop() || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {/* ANALYTICS & REPORTS COMPONENT */}
            {(currentRoute === '/platform/analytics-reports' || currentRoute.startsWith('/platform/analytics-reports/')) && (
              <AnalyticsReportsPage
                reportKey={decodeURIComponent(currentRoute.split('/')[3] || 'overview')}
                navigate={setCurrentRoute}
                showToast={showToast}
                refreshShell={syncStateFromStorage}
              />
            )}

            {/* ANNOUNCEMENTS COMPONENTS */}
            {currentRoute === '/platform/announcements' && (
              <AnnouncementsPage navigate={setCurrentRoute} showToast={showToast} />
            )}
            {currentRoute === '/platform/announcements/new' && (
              <AnnouncementFormPage navigate={setCurrentRoute} showToast={showToast} />
            )}
            {currentRoute.startsWith('/platform/announcements/') && currentRoute.endsWith('/edit') && (
              <AnnouncementFormPage
                announcementId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}
            {currentRoute.startsWith('/platform/announcements/') && currentRoute !== '/platform/announcements/new' && !currentRoute.endsWith('/edit') && (
              <AnnouncementDetailsPage
                announcementId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {/* NOTIFICATIONS COMPONENTS */}
            {currentRoute === '/platform/notifications' || currentRoute === '/platform/notifications/preferences' ? (
              <NotificationsPage navigate={setCurrentRoute} showToast={showToast} />
            ) : null}
            {currentRoute.startsWith('/platform/notifications/') && currentRoute !== '/platform/notifications/preferences' && (
              <NotificationDetailsPage
                notificationId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}
            {/* AUDIT LOGS COMPONENTS */}
            {currentRoute === '/platform/audit-logs' && (
              <AuditLogsPage navigate={setCurrentRoute} showToast={showToast} />
            )}
            {currentRoute === '/platform/audit-logs/integrity' && (
              <AuditIntegrityPage navigate={setCurrentRoute} showToast={showToast} />
            )}
            {currentRoute.startsWith('/platform/audit-logs/correlation/') && (
              <AuditCorrelationPage
                correlationId={decodeURIComponent(currentRoute.split('/')[4] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}
            {currentRoute.startsWith('/platform/audit-logs/') && currentRoute !== '/platform/audit-logs/integrity' && !currentRoute.startsWith('/platform/audit-logs/correlation/') && (
              <AuditDetailsPage
                auditLogId={decodeURIComponent(currentRoute.split('/')[3] || '')}
                navigate={setCurrentRoute}
                showToast={showToast}
              />
            )}

            {currentRoute.startsWith('/platform/data-restore') && (
              <DataRestorePage route={currentRoute} navigate={setCurrentRoute} showToast={showToast} refreshShell={syncStateFromStorage} />
            )}

            {currentRoute.startsWith('/platform/settings') && (
              <PlatformSettingsPage route={currentRoute} navigate={setCurrentRoute} showToast={showToast} refreshShell={syncStateFromStorage} />
            )}

            {/* SHARED UNDER DEVELOPMENT MODULE */}
            {currentRoute.startsWith('/platform/') && 
             currentRoute !== '/platform/dashboard' && 
             currentRoute !== '/platform/subscribers' && 
             !currentRoute.startsWith('/platform/subscribers/') && 
             currentRoute !== '/platform/users' && 
             !currentRoute.startsWith('/platform/users/') && 
             currentRoute !== '/platform/registrations' && 
             !currentRoute.startsWith('/platform/plans') && 
             !currentRoute.startsWith('/platform/subscriptions') && 
             !currentRoute.startsWith('/platform/payments') && 
             !currentRoute.startsWith('/platform/clinics') && 
             !currentRoute.startsWith('/platform/laboratories') && 
             !currentRoute.startsWith('/platform/analytics-reports') && 
             !currentRoute.startsWith('/platform/announcements') && 
             !currentRoute.startsWith('/platform/notifications') && 
             !currentRoute.startsWith('/platform/audit-logs') && 
             !currentRoute.startsWith('/platform/data-restore') && 
             !currentRoute.startsWith('/platform/settings') && 
             !currentRoute.includes('/registrations/') && (
              <main className="main-content">
                <div className="under-dev-container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                  <div className="under-dev-icon-wrapper" style={{ margin: '0 auto 1.5rem auto', display: 'flex', justifyContent: 'center', color: 'var(--secondary)' }}>
                    {currentRoute === '/platform/users' && <UserSquare2 size={48} />}
                    {currentRoute === '/platform/clinics' && <Building2 size={48} />}
                    {currentRoute === '/platform/laboratories' && <FlaskConical size={48} />}
                    {currentRoute === '/platform/analytics-reports' && <BarChart3 size={48} />}
                    {currentRoute === '/platform/announcements' && <Megaphone size={48} />}
                    {currentRoute === '/platform/notifications' && <Bell size={48} />}
                    {currentRoute === '/platform/settings' && <Settings size={48} />}
                  </div>
                  <h2>{activeModule} Module</h2>
                  <p className="under-dev-desc" style={{ color: 'var(--text-secondary)', margin: '1rem auto 2rem auto', maxWidth: '420px' }}>
                    {currentRoute === '/platform/users' && 'This module is under development and will eventually list Clinic Owners, Dentists, and clinic staff configuration charts.'}
                    {currentRoute === '/platform/clinics' && 'This module is under development and will show all clinics registered by subscriber nodes.'}
                    {currentRoute === '/platform/laboratories' && 'This module is under development and will display laboratory parameter connections.'}
                    {currentRoute === '/platform/analytics-reports' && 'This module is under development and will visualize Monthly Recurring Revenue (MRR) and clinic acquisition trends.'}
                    {currentRoute === '/platform/announcements' && 'This module is under development and will broadcast notifications to clinic owner dashboards.'}
                    {currentRoute === '/platform/notifications' && 'This module is under development and will display administrative alerts for payment confirmations.'}
                    {currentRoute === '/platform/settings' && 'This module is under development and will manage logo branding and payment vendor key setups.'}
                  </p>
                  <span className="badge-prototype" style={{ display: 'inline-block', marginBottom: '1.5rem' }}><ShieldAlert size={12} /> Prototype Mode Only</span>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setCurrentRoute('/platform/dashboard')}>
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              </main>
            )}

          </div>
        </div>
      )
    )}

      <Modal
        open={staleSafePurgeModalOpen}
        title="Purge stale processed platform data?"
        description="This clears processed records under Clinic Owners, Clinic Staff & Doctors, Dental Clinics, Partner Laboratories, Subscription Plans, Active Subscriptions, Payments & Receipts, plus linked branch workspace traces. Platform admin access, settings baseline, and restore checkpoints will be preserved. Type PURGE STALE DATA to continue."
        role="alertdialog"
        onClose={() => { setStaleSafePurgeModalOpen(false); setStaleSafePurgeConfirmation(''); }}
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => { setStaleSafePurgeModalOpen(false); setStaleSafePurgeConfirmation(''); }}>Cancel</button>
            <button className="btn btn-danger" style={{ width: 'auto' }} disabled={staleSafePurgeConfirmation !== 'PURGE STALE DATA'} onClick={handleStaleSafePurge}>Run Stale-Safe Purge</button>
          </>
        )}
      >
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ padding: '0.9rem 1rem', borderRadius: '14px', border: '1px solid #fecaca', background: '#fff5f5', color: '#991b1b', fontSize: '0.9rem', lineHeight: 1.6 }}>
            Use this before end-to-end testing when ghost, embedded, stale, seeded, or processed cross-module records are causing confusion in registration, payments, subscriptions, clinics, laboratories, or linked branch workspaces.
          </div>
          <label className="form-control">
            <span>Confirmation Phrase</span>
            <input className="form-input" value={staleSafePurgeConfirmation} onChange={event => setStaleSafePurgeConfirmation(event.target.value)} placeholder="PURGE STALE DATA" />
          </label>
        </div>
      </Modal>

      <Modal
        open={resetMockModalOpen}
        title="Reset all prototype data?"
        description="This creates a pre-reset local checkpoint, clears non-session prototype data, reseeds mock records, signs out, and returns to Login. Type RESET MOCK DATA to continue."
        role="alertdialog"
        onClose={() => { setResetMockModalOpen(false); setResetMockConfirmation(''); }}
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => { setResetMockModalOpen(false); setResetMockConfirmation(''); }}>Cancel</button>
            <button className="btn btn-danger" style={{ width: 'auto' }} disabled={resetMockConfirmation !== 'RESET MOCK DATA'} onClick={handleResetMockData}>Reset Mock Data</button>
          </>
        )}
      >
        <label className="form-control">
          <span>Confirmation Phrase</span>
          <input className="form-input" value={resetMockConfirmation} onChange={event => setResetMockConfirmation(event.target.value)} placeholder="RESET MOCK DATA" />
        </label>
      </Modal>

      <ConfirmationDialog
        open={approvePaymentModalOpen}
        title="Approve this payment?"
        description="This will mark the submitted payment as approved and allow the subscriber account to proceed to account provisioning."
        confirmLabel="Approve Payment"
        onCancel={() => setApprovePaymentModalOpen(false)}
        onConfirm={handleApprovePayment}
      />

      <Modal
        open={provisionSuccessModalOpen}
        title="🎉 Clinic Owner Account Provisioned & Activated"
        description="Payment has been verified and clinic owner access credentials have been issued."
        onClose={() => setProvisionSuccessModalOpen(false)}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ width: 'auto' }}
              onClick={() => {
                if (provisionSuccessData) {
                  const text = `Clinic Name: ${provisionSuccessData.clinicName}\nOwner: ${provisionSuccessData.ownerName}\nLogin Email: ${provisionSuccessData.ownerEmail}\nTemporary Password: ${provisionSuccessData.tempPassword}\nPlan Tier: ${provisionSuccessData.plan} Enterprise Plan\nSign-in URL: ${window.location.origin}/login`;
                  navigator.clipboard.writeText(text);
                  showToast("Complete credentials copied to clipboard!", "success");
                }
              }}
            >
              Copy Full Credentials
            </button>
            {provisionSuccessData?.subscriberId && (
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto' }}
                onClick={() => {
                  setProvisionSuccessModalOpen(false);
                  setCurrentRoute(`/platform/subscribers/${provisionSuccessData.subscriberId}`);
                }}
              >
                View Clinic Owner Profile
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => setProvisionSuccessModalOpen(false)}
            >
              Done
            </button>
          </div>
        )}
      >
        {provisionSuccessData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Clinic Facility</span>
                <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{provisionSuccessData.clinicName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Subscribed Tier</span>
                <span style={{ color: '#2563eb', fontWeight: 700 }}>{provisionSuccessData.plan} Enterprise Plan</span>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Clinic Owner</span>
                <strong style={{ color: '#0f172a' }}>{provisionSuccessData.ownerName}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Registered Login Email</span>
                <strong style={{ color: '#0f172a' }}>{provisionSuccessData.ownerEmail}</strong>
              </div>
            </div>

            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1.25rem' }}>
              <span style={{ color: '#166534', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.35rem' }}>
                Temporary Access Password (Issued for First Sign-In)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <code style={{
                  flex: 1,
                  backgroundColor: '#ffffff',
                  padding: '0.6rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #86efac',
                  fontFamily: 'monospace',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  color: '#15803d',
                  letterSpacing: '0.05em'
                }}>
                  {provisionSuccessData.tempPassword}
                </code>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', backgroundColor: '#16a34a', borderColor: '#16a34a', padding: '0.6rem 1.25rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(provisionSuccessData.tempPassword);
                    showToast("Temporary password copied to clipboard!", "success");
                  }}
                >
                  Copy Password
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#166534', marginTop: '0.5rem', display: 'block' }}>
                ℹ️ The clinic owner will use this temporary password to log in and will be prompted to set a permanent password upon first sign-in.
              </span>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={rejectPaymentModalOpen}
        title="Reject Payment Reference?"
        description="Specify the mock audit reason for rejecting this payment reference."
        onClose={() => setRejectPaymentModalOpen(false)}
        role="alertdialog"
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={() => setRejectPaymentModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" style={{ width: 'auto', backgroundColor: 'var(--danger)' }} onClick={handleRejectPayment}>Reject Payment</button>
          </>
        )}
      >
        <div className="form-group">
          <label className="form-label">Specify Rejection Reason *</label>
          <textarea
            className="form-input"
            rows={3}
            style={{ width: '100%', resize: 'none' }}
            placeholder="e.g. Reference number not found in GCash merchant logs."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmationDialog
        open={logoutModalOpen}
        title="Sign out of your account?"
        description="You will need to sign in again to access the Portal."
        confirmLabel="Sign Out"
        destructive
        onCancel={() => setLogoutModalOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}

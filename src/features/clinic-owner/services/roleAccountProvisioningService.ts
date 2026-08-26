import { mockClinicService } from '../../clinics/services/mockClinicService';

type ProvisionRole = 'associate' | 'staff';

interface ProvisionInput {
  role: ProvisionRole;
  recordId: string;
  email: string;
  password?: string;
  name: string;
  subscriberId: string;
  clinicNames: string[];
  status: 'active' | 'inactive' | 'draft' | 'on_leave';
  clinicName?: string;
  privileges?: Record<string, boolean>;
}

interface AuthRecord {
  email: string;
  passwordHash: string;
  role: ProvisionRole;
  status: 'active' | 'suspended';
  name: string;
  clinicName?: string;
  subscriberId: string;
  clinicIds: string[];
  linkedRecordId: string;
  mustChangePassword: boolean;
  privileges?: Record<string, boolean>;
}

const USERS_KEY = 'pnj_mock_users';

const readUsers = (): AuthRecord[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeUsers = (users: AuthRecord[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let value = '';
  for (let index = 0; index < 10; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `Pnj-${value}!`;
};

const normalize = (value: string) => value.trim().toLowerCase();

export const roleAccountProvisioningService = {
  sync(input: ProvisionInput): { ok: boolean; error?: string } {
    const result = this.provision({ ...input, password: input.password || undefined });
    return { ok: result.ok, error: result.error };
  },
  provision(input: ProvisionInput): { ok: boolean; temporaryPassword?: string; error?: string } {
    const email = normalize(input.email);
    if (!email) return { ok: false, error: 'A login email is required.' };

    const users = readUsers();
    const existing = users.find((user) => user.email === email || user.linkedRecordId === input.recordId);
    if (existing && existing.linkedRecordId !== input.recordId) {
      return { ok: false, error: 'This email is already linked to another system account.' };
    }

    const clinicIds = mockClinicService
      .getClinicsBySubscriberId(input.subscriberId)
      .filter((clinic) => input.clinicNames.some((name) => normalize(name) === normalize(clinic.name)))
      .map((clinic) => clinic.id);

    if (clinicIds.length === 0) {
      return { ok: false, error: 'Assign at least one valid clinic before activating this account.' };
    }

    const suppliedPassword = input.password?.trim();
    const password = suppliedPassword || existing?.passwordHash || generateTemporaryPassword();
    const mustChangePassword = !suppliedPassword && !existing?.passwordHash;
    const next: AuthRecord = {
      email,
      passwordHash: password,
      role: input.role,
      status: input.status === 'active' ? 'active' : 'suspended',
      name: input.name.trim(),
      clinicName: input.clinicName,
      subscriberId: input.subscriberId,
      clinicIds,
      linkedRecordId: input.recordId,
      mustChangePassword
      , privileges: input.privileges || existing?.privileges || {}
    };

    writeUsers(existing ? users.map((user) => user === existing ? next : user).filter((user) => user.linkedRecordId !== input.recordId || user === next) : [next, ...users]);
    return { ok: true, temporaryPassword: mustChangePassword ? password : undefined };
  }
};

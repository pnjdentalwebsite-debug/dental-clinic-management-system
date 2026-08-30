import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ClinicOwnerApiError,
  getClinicOwnerBootstrap,
  type ClinicOwnerBootstrap,
} from '../../../infrastructure/supabase/clinicOwnerApi';

export type ClinicOwnerReadStatus =
  | 'loading'
  | 'ready'
  | 'unauthorized'
  | 'membership_conflict'
  | 'subscription_unavailable'
  | 'data_unavailable';

export interface ClinicOwnerReadModel {
  status: ClinicOwnerReadStatus;
  loading: boolean;
  error: string | null;
  bootstrap: ClinicOwnerBootstrap | null;
  refresh: () => Promise<void>;
}

type BootstrapLoader = () => Promise<ClinicOwnerBootstrap>;

const ClinicOwnerReadContext = createContext<ClinicOwnerReadModel | null>(null);

function safeFailure(error: unknown): Pick<ClinicOwnerReadModel, 'status' | 'error'> {
  if (error instanceof ClinicOwnerApiError) {
    if (error.code === 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS') {
      return { status: 'membership_conflict', error: error.message };
    }
    if (error.code === 'SUBSCRIPTION_NOT_FOUND' || error.code === 'PLAN_NOT_FOUND') {
      return { status: 'subscription_unavailable', error: error.message };
    }
    if (error.code === 'UNAUTHENTICATED'
      || error.code === 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP'
      || error.code === 'PASSWORD_CHANGE_REQUIRED') {
      return { status: 'unauthorized', error: error.message };
    }
    return { status: 'data_unavailable', error: error.message };
  }
  return {
    status: 'data_unavailable',
    error: 'Clinic Owner data could not be loaded. No mock data was substituted.',
  };
}

export function ClinicOwnerReadProvider({
  enabled,
  children,
  loadBootstrap = getClinicOwnerBootstrap,
}: {
  enabled: boolean;
  children: ReactNode;
  loadBootstrap?: BootstrapLoader;
}) {
  const requestVersion = useRef(0);
  const [status, setStatus] = useState<ClinicOwnerReadStatus>(enabled ? 'loading' : 'unauthorized');
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<ClinicOwnerBootstrap | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      requestVersion.current += 1;
      setBootstrap(null);
      setError(null);
      setStatus('unauthorized');
      return;
    }
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setBootstrap(null);
    setError(null);
    setStatus('loading');
    try {
      const next = await loadBootstrap();
      if (requestVersion.current !== version) return;
      setBootstrap(next);
      setStatus('ready');
    } catch (requestError) {
      if (requestVersion.current !== version) return;
      const failure = safeFailure(requestError);
      setBootstrap(null);
      setError(failure.error);
      setStatus(failure.status);
    }
  }, [enabled, loadBootstrap]);

  useEffect(() => {
    if (enabled) {
      void refresh();
      return () => {
        requestVersion.current += 1;
      };
    }
    requestVersion.current += 1;
    setBootstrap(null);
    setError(null);
    setStatus('unauthorized');
    return undefined;
  }, [enabled, refresh]);

  const value = useMemo<ClinicOwnerReadModel>(() => ({
    status,
    loading: status === 'loading',
    error,
    bootstrap,
    refresh,
  }), [status, error, bootstrap, refresh]);

  return <ClinicOwnerReadContext.Provider value={value}>{children}</ClinicOwnerReadContext.Provider>;
}

export function useClinicOwnerRead(): ClinicOwnerReadModel {
  const value = useContext(ClinicOwnerReadContext);
  if (!value) throw new Error('useClinicOwnerRead must be used inside ClinicOwnerReadProvider.');
  return value;
}

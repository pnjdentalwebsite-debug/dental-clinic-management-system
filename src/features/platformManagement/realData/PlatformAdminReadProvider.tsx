import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { platformAdminApi, PlatformAdminClientError, type PlatformAdminReadResource } from '../../../infrastructure/supabase/platformAdminApi';
import { clearPlatformAdminSnapshot, installPlatformAdminDirectoryItem, installPlatformAdminSnapshot } from './platformAdminRealDataService';

type DetailResource = Exclude<PlatformAdminReadResource, 'summary'>;

interface PlatformAdminReadContextValue {
  loading: boolean;
  error: string | null;
  revision: number;
  refresh: () => Promise<void>;
  loadDetail: (resource: DetailResource, id: string) => Promise<void>;
}

const PlatformAdminReadContext = createContext<PlatformAdminReadContextValue | null>(null);
const standaloneReadContext: PlatformAdminReadContextValue = {
  loading: false,
  error: null,
  revision: 0,
  refresh: async () => undefined,
  loadDetail: async () => undefined,
};

const safeMessage = (error: unknown) => error instanceof PlatformAdminClientError
  ? error.message
  : 'Real Platform Administrator data could not be loaded. No mock data was substituted.';

export function PlatformAdminReadProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [directory, review] = await Promise.all([
        platformAdminApi.getDirectorySnapshot(),
        platformAdminApi.listAllReview({ registrationStatus: 'pending_review' }),
      ]);
      installPlatformAdminSnapshot(directory, review.items);
      setRevision(value => value + 1);
    } catch (requestError) {
      clearPlatformAdminSnapshot();
      setRevision(value => value + 1);
      setError(safeMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const loadDetail = useCallback(async (resource: DetailResource, id: string) => {
    if (!enabled || !id) return;
    try {
      const result = await platformAdminApi.readDirectory(resource, { id });
      if ('item' in result) {
        installPlatformAdminDirectoryItem(resource, result.item);
        setRevision(value => value + 1);
      }
    } catch (requestError) {
      setError(safeMessage(requestError));
      throw requestError;
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void refresh();
    else {
      clearPlatformAdminSnapshot();
      setError(null);
      setLoading(false);
      setRevision(value => value + 1);
    }
  }, [enabled, refresh]);

  const value = useMemo(() => ({ loading, error, revision, refresh, loadDetail }), [loading, error, revision, refresh, loadDetail]);
  return <PlatformAdminReadContext.Provider value={value}>{children}</PlatformAdminReadContext.Provider>;
}

export function usePlatformAdminReadModel(): PlatformAdminReadContextValue {
  const value = useContext(PlatformAdminReadContext);
  return value ?? standaloneReadContext;
}

export function usePlatformAdminDetail(resource: DetailResource, id: string): PlatformAdminReadContextValue {
  const model = usePlatformAdminReadModel();
  useEffect(() => {
    void model.loadDetail(resource, id).catch(() => undefined);
  }, [resource, id, model.loadDetail]);
  return model;
}

export function PlatformAdminReadNotice() {
  const { loading, error, refresh } = usePlatformAdminReadModel();
  if (!loading && !error) return null;
  return (
    <div className={`banner-alert ${error ? 'danger' : 'info'}`} style={{ margin: '0.75rem 1.5rem 0' }} role={error ? 'alert' : 'status'}>
      <strong>{error ? 'Platform data unavailable' : 'Loading live Platform data…'}</strong>
      {error && <><p>{error}</p><button className="btn btn-outline" style={{ width: 'auto', marginTop: '0.5rem' }} onClick={() => void refresh()}>Retry</button></>}
    </div>
  );
}

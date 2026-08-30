import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { platformAdminApi, PlatformAdminClientError, type PlatformAdminReadPage, type PlatformAdminReadQuery, type PlatformAdminReadResource } from '../../../infrastructure/supabase/platformAdminApi';
import { clearPlatformAdminResource, clearPlatformAdminSnapshot, installPlatformAdminDashboard, installPlatformAdminDirectoryItem, installPlatformAdminDirectoryPage, mapPlatformAdminDirectoryItems, type PlatformAdminSummary } from './platformAdminRealDataService';

type DetailResource = Exclude<PlatformAdminReadResource, 'summary'>;

interface PlatformAdminReadContextValue {
  loading: boolean;
  error: string | null;
  revision: number;
  summary: PlatformAdminSummary;
  refresh: () => Promise<void>;
  loadPage: (resource: DetailResource, query: PlatformAdminReadQuery) => Promise<PlatformAdminReadPage<any>>;
  loadDetail: (resource: DetailResource, id: string) => Promise<void>;
}

const PlatformAdminReadContext = createContext<PlatformAdminReadContextValue | null>(null);
const emptySummary: PlatformAdminSummary = { pendingRegistrationReviews: 0, pendingPaymentReviews: 0, activeSubscribers: 0, activeClinics: 0, activeSubscriptions: 0, platformUsers: 0, activeSubscriptionMrrCentavos: 0, subscriptionStatuses: { active: 0, pending: 0, expiringSoon: 0, expired: 0, suspended: 0, cancelled: 0 }, activePlanDistribution: {}, subscriberSummary: { total: 0, active: 0, pending: 0, suspended: 0, deactivated: 0 }, clinicSummary: { total: 0, active: 0, pending: 0, draft: 0, inactive: 0, archived: 0, primary: 0, withoutDentists: 0, withoutStaff: 0 }, paymentSummary: { total: 0, pendingVerification: 0, approved: 0, rejected: 0, refunded: 0, voided: 0, approvedAmountCentavos: 0, refundedAmountCentavos: 0 }, personnelSummary: { total: 0, active: 0, associates: 0, staff: 0 } };
const standaloneReadContext: PlatformAdminReadContextValue = {
  loading: false,
  error: null,
  revision: 0,
  summary: emptySummary,
  refresh: async () => undefined,
  loadPage: async () => ({ items: [], page: 1, pageSize: 25, total: 0 }),
  loadDetail: async () => undefined,
};

const safeMessage = (error: unknown) => error instanceof PlatformAdminClientError
  ? error.message
  : 'Real Platform Administrator data could not be loaded. No mock data was substituted.';

export function PlatformAdminReadProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [summary, setSummary] = useState<PlatformAdminSummary>(emptySummary);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryResult, review] = await Promise.all([
        platformAdminApi.getSummary(),
        platformAdminApi.listAllReview({ registrationStatus: 'pending_review' }),
      ]);
      installPlatformAdminDashboard(summaryResult.summary, review.items);
      setSummary(summaryResult.summary);
      setRevision(value => value + 1);
    } catch (requestError) {
      clearPlatformAdminSnapshot();
      setSummary(emptySummary);
      setRevision(value => value + 1);
      setError(safeMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  const loadPage = useCallback(async (resource: DetailResource, query: PlatformAdminReadQuery) => {
    if (!enabled) return { items: [], page: query.page ?? 1, pageSize: query.pageSize ?? 25, total: 0 };
    try {
      const result = await platformAdminApi.readDirectory(resource, query);
      if (!('items' in result)) throw new PlatformAdminClientError('PLATFORM_ADMIN_REQUEST_FAILED', 'The Platform Administrator page returned an invalid response.');
      installPlatformAdminDirectoryPage(resource, result.items);
      setError(null);
      setRevision(value => value + 1);
      return { ...result, items: mapPlatformAdminDirectoryItems(resource, result.items) };
    } catch (requestError) {
      clearPlatformAdminResource(resource);
      setRevision(value => value + 1);
      setError(safeMessage(requestError));
      throw requestError;
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
      setSummary(emptySummary);
      setError(null);
      setLoading(false);
      setRevision(value => value + 1);
    }
  }, [enabled, refresh]);

  const value = useMemo(() => ({ loading, error, revision, summary, refresh, loadPage, loadDetail }), [loading, error, revision, summary, refresh, loadPage, loadDetail]);
  return <PlatformAdminReadContext.Provider value={value}>{children}</PlatformAdminReadContext.Provider>;
}

export function usePlatformAdminDirectoryPage(resource: DetailResource, query: PlatformAdminReadQuery) {
  const model = usePlatformAdminReadModel();
  const queryKey = JSON.stringify(query);
  const [result, setResult] = useState<PlatformAdminReadPage<any>>({ items: [], page: query.page ?? 1, pageSize: query.pageSize ?? 25, total: 0 });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await model.loadPage(resource, query);
      setResult(next);
    } finally {
      setLoading(false);
    }
  // queryKey is the stable dependency for the serializable request contract.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.loadPage, resource, queryKey]);

  useEffect(() => { void refresh().catch(() => undefined); }, [refresh]);
  return { ...model, loading: model.loading || loading, result, refresh };
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

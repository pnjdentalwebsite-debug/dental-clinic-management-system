import { response } from './http.ts';

type PlatformAdminContext = {
  userClaims?: { id?: unknown } | null;
  supabaseAdmin: any;
};

export class PlatformAdminApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requirePlatformAdmin(ctx: PlatformAdminContext): Promise<string> {
  const actorId = typeof ctx.userClaims?.id === 'string' ? ctx.userClaims.id : null;
  if (!actorId) throw new PlatformAdminApiError('UNAUTHORIZED', 401, 'Authentication is required.');

  const { data, error } = await ctx.supabaseAdmin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', actorId)
    .maybeSingle();
  if (error) throw new PlatformAdminApiError('AUTHORIZATION_UNAVAILABLE', 503, 'Authorization is temporarily unavailable.');
  if (!data) throw new PlatformAdminApiError('FORBIDDEN', 403, 'Platform administrator access is required.');
  return actorId;
}

export function platformAdminErrorResponse(request: Request, error: unknown, fallback: string): Response {
  if (error instanceof PlatformAdminApiError) {
    return response(request, { error: { code: error.code, message: error.message } }, error.status);
  }
  return response(request, { error: { code: 'INTERNAL_ERROR', message: fallback } }, 500);
}

export function rpcDomainError(error: unknown, fallback: string): PlatformAdminApiError {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('was not found')) return new PlatformAdminApiError('NOT_FOUND', 404, 'The requested review record was not found.');
  if (
    message.includes('not awaiting review')
    || message.includes('not eligible')
    || message.includes('cannot be rejected')
    || message.includes('does not match')
    || message.includes('Exactly one approved payment')
  ) {
    return new PlatformAdminApiError('STATE_CONFLICT', 409, fallback);
  }
  return new PlatformAdminApiError('REVIEW_OPERATION_FAILED', 409, fallback);
}

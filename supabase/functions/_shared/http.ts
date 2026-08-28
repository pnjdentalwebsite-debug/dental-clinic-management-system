export const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
};

export function corsHeaders(request: Request): HeadersInit {
  const configuredOrigin = Deno.env.get('ALLOWED_ORIGIN');
  const requestOrigin = request.headers.get('origin') ?? '';
  const localOrigins = new Set(['http://localhost:5173', 'http://127.0.0.1:5173']);
  const allowedOrigin = configuredOrigin && requestOrigin === configuredOrigin
    ? configuredOrigin
    : localOrigins.has(requestOrigin)
      ? requestOrigin
      : 'null';

  return {
    ...jsonHeaders,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

export function preflight(request: Request): Response | null {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(request) });
  return null;
}

export function response(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

export function errorResponse(request: Request, message: string, status = 400): Response {
  return response(request, { error: message }, status);
}

export async function requestJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new Error('A valid JSON request body is required.');
  }
}

export function text(value: unknown, label: string, maxLength = 500): string {
  if (typeof value !== 'string') throw new Error(`${label} is required.`);
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  if (normalized.length > maxLength) throw new Error(`${label} is too long.`);
  return normalized;
}

export function optionalText(value: unknown, maxLength = 500): string | null {
  if (value === undefined || value === null || value === '') return null;
  return text(value, 'Value', maxLength);
}

export function email(value: unknown): string {
  const normalized = text(value, 'Email address', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('A valid email address is required.');
  return normalized;
}

export function uuid(value: unknown, label: string): string {
  const normalized = text(value, label, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(normalized)) {
    throw new Error(`${label} must be a UUID.`);
  }
  return normalized;
}

export function randomPassword(length = 18): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => alphabet[value % alphabet.length]).join('');
}

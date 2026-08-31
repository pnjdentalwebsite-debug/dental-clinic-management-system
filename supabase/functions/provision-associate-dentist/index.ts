import '@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from '@supabase/server';
import { errorResponse, preflight } from '../_shared/http.ts';
import { handleAssociateProvisioning } from './logic.ts';

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);
    return await handleAssociateProvisioning(req, ctx);
  }),
};

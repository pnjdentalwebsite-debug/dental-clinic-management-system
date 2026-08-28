import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { errorResponse, preflight, randomPassword, requestJson, response, uuid } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const actorId = ctx.userClaims?.id;
      if (!actorId) return errorResponse(req, 'Authentication is required.', 401);
      // The caller identity is verified by withSupabase. The server-side lookup
      // then checks the authoritative platform-admin ledger, not JWT metadata.
      const { data: platformAdmin } = await ctx.supabaseAdmin
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', actorId)
        .maybeSingle();
      if (!platformAdmin) return errorResponse(req, 'Platform administrator access is required.', 403);

      const payload = await requestJson(req);
      const registrationId = uuid(payload.registrationId, 'registrationId');
      const { data: registration, error: registrationError } = await ctx.supabaseAdmin
        .from('registrations')
        .select('id, owner_email, owner_name, provisioned_at')
        .eq('id', registrationId)
        .maybeSingle();
      if (registrationError) throw new Error('Unable to locate the registration.');
      if (!registration) return errorResponse(req, 'Registration was not found.', 404);
      if (registration.provisioned_at) {
        return errorResponse(req, 'This registration was already provisioned. Use account recovery if credentials are needed.', 409);
      }

      const temporaryPassword = randomPassword();
      const { data: createdUser, error: createUserError } = await ctx.supabaseAdmin.auth.admin.createUser({
        email: registration.owner_email,
        password: temporaryPassword,
        email_confirm: true,
        app_metadata: { pnj_role: 'clinic_owner' },
        user_metadata: { display_name: registration.owner_name },
      });
      if (createUserError || !createdUser.user) {
        return errorResponse(req, createUserError?.message ?? 'Unable to create the clinic owner account.', 409);
      }

      const { data: provisioned, error: provisionError } = await ctx.supabaseAdmin.rpc('approve_registration_provisioning', {
        p_registration_id: registrationId,
        p_owner_user_id: createdUser.user.id,
        p_actor_user_id: actorId,
      });
      if (provisionError || !provisioned?.[0]) {
        await ctx.supabaseAdmin.auth.admin.deleteUser(createdUser.user.id, true);
        throw new Error(provisionError?.message ?? 'Unable to provision the subscriber account.');
      }

      const scope = provisioned[0] as {
        subscriber_id: string;
        clinic_id: string;
        membership_id: string;
        subscriber_number: string;
        clinic_number: string;
      };
      return response(req, {
        account: { email: registration.owner_email, temporaryPassword, requiresPasswordChange: true },
        scope: {
          subscriberId: scope.subscriber_id,
          clinicId: scope.clinic_id,
          membershipId: scope.membership_id,
          subscriberNumber: scope.subscriber_number,
          clinicNumber: scope.clinic_number,
        },
      });
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to approve the registration.');
    }
  }),
};

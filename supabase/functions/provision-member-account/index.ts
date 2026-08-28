import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { email, errorResponse, optionalText, preflight, randomPassword, requestJson, response, text, uuid } from "../_shared/http.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const options = preflight(req);
    if (options) return options;
    if (req.method !== 'POST') return errorResponse(req, 'Method not allowed.', 405);

    try {
      const actorId = ctx.userClaims?.id;
      if (!actorId) return errorResponse(req, 'Authentication is required.', 401);
      const payload = await requestJson(req);
      const subscriberId = uuid(payload.subscriberId, 'subscriberId');
      const role = text(payload.role, 'Role', 20);
      if (role !== 'staff' && role !== 'associate') return errorResponse(req, 'Role must be staff or associate.', 422);
      const authorizedClinicIds = Array.isArray(payload.authorizedClinicIds)
        ? payload.authorizedClinicIds.map((id) => uuid(id, 'authorizedClinicIds'))
        : [];
      if (authorizedClinicIds.length === 0) return errorResponse(req, 'At least one authorized clinic is required.', 422);
      const { data: ownership } = await ctx.supabaseAdmin
        .from('subscriber_memberships')
        .select('id')
        .eq('subscriber_id', subscriberId)
        .eq('user_id', actorId)
        .eq('role', 'clinic_owner')
        .eq('account_status', 'active')
        .maybeSingle();
      if (!ownership) return errorResponse(req, 'Only the active clinic owner can create this account.', 403);

      const accountEmail = email(payload.email);
      const requestedPassword = optionalText(payload.temporaryPassword, 256);
      if (requestedPassword && requestedPassword.length < 12) return errorResponse(req, 'Temporary passwords must have at least 12 characters.', 422);
      const temporaryPassword = requestedPassword ?? randomPassword();
      const { data: createdUser, error: createUserError } = await ctx.supabaseAdmin.auth.admin.createUser({
        email: accountEmail,
        password: temporaryPassword,
        email_confirm: true,
        app_metadata: { pnj_role: role },
      });
      if (createUserError || !createdUser.user) return errorResponse(req, createUserError?.message ?? 'Unable to create the account.', 409);

      const { data: provisioned, error: provisionError } = await ctx.supabaseAdmin.rpc('provision_member_account', {
        p_subscriber_id: subscriberId,
        p_actor_user_id: actorId,
        p_user_id: createdUser.user.id,
        p_role: role,
        p_first_name: text(payload.firstName, 'First name', 120),
        p_middle_name: optionalText(payload.middleName, 120),
        p_last_name: text(payload.lastName, 'Last name', 120),
        p_mobile_number: optionalText(payload.mobileNumber, 80),
        p_address: optionalText(payload.address, 1000),
        p_position: optionalText(payload.position, 120),
        p_license_number: optionalText(payload.licenseNumber, 120),
        p_ptr_number: optionalText(payload.ptrNumber, 120),
        p_s2_license_number: optionalText(payload.s2LicenseNumber, 120),
        p_designation: optionalText(payload.designation, 120),
        p_specialization: optionalText(payload.specialization, 120),
        p_calendar_color: optionalText(payload.calendarColor, 20),
        p_certificates_and_qualifications: optionalText(payload.certificatesAndQualifications, 4000),
        p_clinic_ids: authorizedClinicIds,
      });
      if (provisionError || !provisioned?.[0]) {
        await ctx.supabaseAdmin.auth.admin.deleteUser(createdUser.user.id, true);
        throw new Error(provisionError?.message ?? 'Unable to save the personnel record.');
      }
      const record = provisioned[0] as { membership_id: string; personnel_number: string };
      return response(req, {
        account: { email: accountEmail, temporaryPassword, requiresPasswordChange: true },
        membershipId: record.membership_id,
        personnelNumber: record.personnel_number,
      }, 201);
    } catch (error) {
      return errorResponse(req, error instanceof Error ? error.message : 'Unable to provision account.');
    }
  }),
};

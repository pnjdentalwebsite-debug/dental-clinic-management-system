export interface RegistrationOtpEmail {
  to: string;
  code: string;
  expiresInMinutes: number;
}

export interface RegistrationEmailMessage {
  to: string;
  subject: string;
  text: string;
  htmlBody?: string;
}

export interface InitialClinicOwnerCredentialEmail {
  to: string;
  temporaryPassword: string;
}

/**
 * Provider-neutral HTTP email boundary. Configure an internal mail gateway or
 * provider adapter outside the registration domain; secrets remain server-side.
 */
export async function sendRegistrationEmail(message: RegistrationEmailMessage): Promise<void> {
  const endpoint = Deno.env.get('REGISTRATION_EMAIL_ENDPOINT');
  const token = Deno.env.get('REGISTRATION_EMAIL_API_TOKEN');
  const sender = Deno.env.get('REGISTRATION_EMAIL_FROM');
  if (!endpoint || !token || !sender) {
    throw new Error('Registration email delivery is not configured.');
  }

  const result = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gatewayToken: token,
      from: sender,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.htmlBody ? { htmlBody: message.htmlBody } : {}),
    }),
  });
  if (!result.ok) throw new Error('Registration email delivery failed.');
}

export async function sendRegistrationOtpEmail(message: RegistrationOtpEmail): Promise<void> {
  await sendRegistrationEmail({
    to: message.to,
    subject: 'Your registration verification code',
    text: `Your registration verification code is ${message.code}. It expires in ${message.expiresInMinutes} minutes.`,
  });
}

export async function sendInitialClinicOwnerCredentialEmail(
  message: InitialClinicOwnerCredentialEmail,
): Promise<void> {
  await sendRegistrationEmail({
    to: message.to,
    subject: 'Your PJ Dental Clinic Owner account',
    text: [
      `Clinic Owner account: ${message.to}`,
      `Temporary password: ${message.temporaryPassword}`,
      'Sign in with this temporary credential and change your password immediately on first login.',
    ].join('\n\n'),
  });
}

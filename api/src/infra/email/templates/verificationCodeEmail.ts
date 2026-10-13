import type { IEmailTemplates } from '#application/contracts/gateways/IEmailTemplates';
import { escapeHtml } from '#infra/email/templates/escapeHtml';

const copy = {
  email_verification: {
    subject: 'Confirme seu email',
    intro: 'Use o código abaixo para confirmar seu email:',
  },
  password_reset: {
    subject: 'Redefinição de senha',
    intro: 'Use o código abaixo para redefinir sua senha:',
  },
} as const;

export function verificationCodeEmail({
  name,
  code,
  purpose,
  expiresInMinutes,
}: IEmailTemplates.VerificationCodeInput): IEmailTemplates.Content {
  const { subject, intro } = copy[purpose];
  const footer = `O código expira em ${expiresInMinutes} minutos. Se você não fez esta solicitação, ignore este email.`;

  return {
    subject,
    text: `Olá, ${name}!\n\n${intro}\n\n${code}\n\n${footer}`,
    html: [
      `<p>Olá, ${escapeHtml(name)}!</p>`,
      `<p>${intro}</p>`,
      `<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p>`,
      `<p style="color:#666">${footer}</p>`,
    ].join('\n'),
  };
}

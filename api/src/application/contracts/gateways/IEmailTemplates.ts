import type { VerificationCode } from '#application/entities/VerificationCode';

/** Rendering lives in infra/email/templates; application only asks for the content. */
export interface IEmailTemplates {
  verificationCode(input: IEmailTemplates.VerificationCodeInput): IEmailTemplates.Content;
}

export namespace IEmailTemplates {
  export type Content = { subject: string; html: string; text: string };

  export type VerificationCodeInput = {
    name: string;
    code: string;
    purpose: VerificationCode.Purpose;
    expiresInMinutes: number;
  };
}

import { randomUUID } from 'node:crypto';
import { VerificationCode } from '#application/entities/VerificationCode';

export function makeVerificationCode(override: Partial<VerificationCode.Attributes> & { userId: string }): VerificationCode {
  return new VerificationCode({
    purpose: 'email_verification',
    codeHash: randomUUID(),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    ...override,
  });
}

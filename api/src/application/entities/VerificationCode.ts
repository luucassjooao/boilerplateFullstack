import { v7 as uuidv7 } from 'uuid';

export class VerificationCode {
  readonly id: string;
  readonly userId: string;
  readonly purpose: VerificationCode.Purpose;
  readonly codeHash: string;
  readonly expiresAt: Date;
  readonly attempts: number;
  readonly consumedAt: Date | null;
  readonly createdAt: Date;

  constructor(attributes: VerificationCode.Attributes) {
    this.id = attributes.id ?? uuidv7();
    this.userId = attributes.userId;
    this.purpose = attributes.purpose;
    this.codeHash = attributes.codeHash;
    this.expiresAt = attributes.expiresAt;
    this.attempts = attributes.attempts ?? 0;
    this.consumedAt = attributes.consumedAt ?? null;
    this.createdAt = attributes.createdAt ?? new Date();
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}

export namespace VerificationCode {
  export type Purpose = 'email_verification' | 'password_reset';

  export type Attributes = {
    id?: string;
    userId: string;
    purpose: Purpose;
    codeHash: string;
    expiresAt: Date;
    attempts?: number;
    consumedAt?: Date | null;
    createdAt?: Date;
  };
}

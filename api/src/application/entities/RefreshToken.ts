import { v7 as uuidv7 } from 'uuid';

export class RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
  readonly userAgent: string | null;

  constructor(attributes: RefreshToken.Attributes) {
    this.id = attributes.id ?? uuidv7();
    this.userId = attributes.userId;
    this.familyId = attributes.familyId;
    this.tokenHash = attributes.tokenHash;
    this.expiresAt = attributes.expiresAt;
    this.usedAt = attributes.usedAt ?? null;
    this.revokedAt = attributes.revokedAt ?? null;
    this.createdAt = attributes.createdAt ?? new Date();
    this.userAgent = attributes.userAgent ?? null;
  }

  isExpired(now = new Date()): boolean {
    return this.expiresAt.getTime() <= now.getTime();
  }
}

export namespace RefreshToken {
  export type Attributes = {
    id?: string;
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
    usedAt?: Date | null;
    revokedAt?: Date | null;
    createdAt?: Date;
    userAgent?: string | null;
  };
}

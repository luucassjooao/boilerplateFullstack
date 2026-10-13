import { v7 as uuidv7 } from 'uuid';
import { User } from '#application/entities/User';

export class AuthIdentity {
  readonly id: string;
  readonly userId: string;
  readonly provider: AuthIdentity.Provider;
  readonly providerUserId: string;
  readonly email: string | null;
  readonly createdAt: Date;

  constructor(attributes: AuthIdentity.Attributes) {
    this.id = attributes.id ?? uuidv7();
    this.userId = attributes.userId;
    this.provider = attributes.provider;
    this.providerUserId = attributes.providerUserId;
    this.email = attributes.email ? User.normalizeEmail(attributes.email) : null;
    this.createdAt = attributes.createdAt ?? new Date();
  }
}

export namespace AuthIdentity {
  export const providers = ['google', 'apple'] as const;

  export type Provider = typeof providers[number];

  export type Attributes = {
    id?: string;
    userId: string;
    provider: Provider;
    providerUserId: string;
    email: string | null;
    createdAt?: Date;
  };
}

import { v7 as uuidv7 } from 'uuid';

export class User {
  readonly id: string;
  readonly createdAt: Date;
  name: string;
  readonly email: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  updatedAt: Date;

  constructor(attributes: User.Attributes) {
    this.id = attributes.id ?? uuidv7();
    this.name = attributes.name;
    this.email = User.normalizeEmail(attributes.email);
    this.emailVerifiedAt = attributes.emailVerifiedAt ?? null;
    this.passwordHash = attributes.passwordHash ?? null;
    this.createdAt = attributes.createdAt ?? new Date();
    this.updatedAt = attributes.updatedAt ?? this.createdAt;
  }

  get emailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }

  verifyEmail(now = new Date()): void {
    if (this.emailVerifiedAt) {
      return;
    }

    this.emailVerifiedAt = now;
    this.updatedAt = now;
  }

  changePassword(passwordHash: string, now = new Date()): void {
    this.passwordHash = passwordHash;
    this.updatedAt = now;
  }

  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}

export namespace User {
  export type Attributes = {
    id?: string;
    name: string;
    email: string;
    emailVerifiedAt?: Date | null;
    passwordHash?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

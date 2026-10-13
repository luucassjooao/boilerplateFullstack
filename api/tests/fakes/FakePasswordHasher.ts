import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';

/** Fast, reversible stand-in for Argon2 in unit tests. */
export class FakePasswordHasher implements IPasswordHasher {
  readonly verifyCalls: { hash: string; plain: string }[] = [];

  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    this.verifyCalls.push({ hash, plain });

    return hash === `hashed:${plain}`;
  }
}

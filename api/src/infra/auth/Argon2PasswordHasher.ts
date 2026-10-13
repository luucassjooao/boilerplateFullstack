import { type Algorithm, hash, verify } from '@node-rs/argon2';
import type { IPasswordHasher } from '#application/contracts/gateways/IPasswordHasher';

// `Algorithm` is an ambient const enum (unusable with verbatimModuleSyntax): 2 = Argon2id.
const ARGON2ID = 2 as Algorithm;

/** Argon2id with the library defaults (OWASP: m=19 MiB, t=2, p=1). */
export class Argon2PasswordHasher implements IPasswordHasher {
  hash(plain: string): Promise<string> {
    return hash(plain, { algorithm: ARGON2ID });
  }

  verify(hashed: string, plain: string): Promise<boolean> {
    return verify(hashed, plain);
  }
}

import { createHash, randomBytes } from 'node:crypto';
import type { IOpaqueTokenService } from '#application/contracts/gateways/IOpaqueTokenService';

/** 32 random bytes (base64url) handed to the client; only the SHA-256 is persisted. */
export class CryptoOpaqueTokenService implements IOpaqueTokenService {
  generate(): { token: string; hash: string } {
    const token = randomBytes(32).toString('base64url');

    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

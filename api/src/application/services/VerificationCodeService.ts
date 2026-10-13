import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';

/** 6-digit numeric codes stored as HMAC-SHA256(code, secret). Pure: no IO. */
export class VerificationCodeService {
  constructor(private readonly secret: string) {}

  generate(): { code: string; hash: string } {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

    return { code, hash: this.hash(code) };
  }

  hash(code: string): string {
    return createHmac('sha256', this.secret).update(code).digest('hex');
  }

  matches(code: string, hash: string): boolean {
    const expected = Buffer.from(hash, 'hex');
    const actual = Buffer.from(this.hash(code), 'hex');

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}

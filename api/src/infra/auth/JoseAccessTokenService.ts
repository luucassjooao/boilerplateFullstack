import { errors, jwtVerify, SignJWT } from 'jose';
import type { IAccessTokenService } from '#application/contracts/gateways/IAccessTokenService';

export class JoseAccessTokenService implements IAccessTokenService {
  private readonly key: Uint8Array;

  constructor(private readonly options: JoseAccessTokenService.Options) {
    this.key = new TextEncoder().encode(options.secret);
  }

  async sign({ userId }: { userId: string }): Promise<string> {
    return new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.options.expiresInSeconds}s`)
      .sign(this.key);
  }

  async verify(token: string): Promise<{ userId: string } | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        issuer: this.options.issuer,
        audience: this.options.audience,
        algorithms: ['HS256'],
      });

      return payload.sub ? { userId: payload.sub } : null;
    } catch (error) {
      if (error instanceof errors.JOSEError) {
        return null;
      }

      throw error;
    }
  }
}

export namespace JoseAccessTokenService {
  export type Options = {
    secret: string;
    issuer: string;
    audience: string;
    expiresInSeconds: number;
  };
}

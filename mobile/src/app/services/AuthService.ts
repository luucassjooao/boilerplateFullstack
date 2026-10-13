import type { AuthTokensManager } from '@app/lib/AuthTokensManager';
import { Service } from '@app/services/Service';
import type { OAuthProvider } from '@app/types/OAuthProvider';

export class AuthService extends Service {
  static async signUp(payload: AuthService.SignUpPayload): Promise<void> {
    await this.client.post('/auth/sign-up', payload);
  }

  static async verifyEmail(payload: AuthService.VerifyEmailPayload): Promise<AuthService.Session> {
    const { data } = await this.client.post<AuthService.Session>('/auth/verify-email', payload);

    return data;
  }

  static async resendVerificationEmail(payload: AuthService.EmailPayload): Promise<void> {
    await this.client.post('/auth/verify-email/resend', payload);
  }

  static async signIn(payload: AuthService.SignInPayload): Promise<AuthService.Session> {
    const { data } = await this.client.post<AuthService.Session>('/auth/sign-in', payload);

    return data;
  }

  static async signOut(refreshToken: string): Promise<void> {
    await this.client.post('/auth/sign-out', { refreshToken });
  }

  static async forgotPassword(payload: AuthService.EmailPayload): Promise<void> {
    await this.client.post('/auth/forgot-password', payload);
  }

  static async resetPassword(payload: AuthService.ResetPasswordPayload): Promise<void> {
    await this.client.post('/auth/reset-password', payload);
  }

  /** Native sign-in: exchanges the provider id_token for a session. */
  static async oauthSignIn(provider: OAuthProvider, payload: AuthService.OAuthPayload): Promise<AuthService.Session> {
    const { data } = await this.client.post<AuthService.Session>(`/auth/oauth/${provider}/token`, payload);

    return data;
  }

  static refresh(): Promise<AuthService.Session> {
    return Service.refreshTokens();
  }
}

export namespace AuthService {
  export type Session = AuthTokensManager.Tokens;
  export type EmailPayload = { email: string };
  export type SignUpPayload = { name: string; email: string; password: string };
  export type SignInPayload = { email: string; password: string };
  export type VerifyEmailPayload = { email: string; code: string };
  export type ResetPasswordPayload = { email: string; code: string; password: string };
  /** `nonce` is the raw nonce (Apple received its SHA-256). `name` only exists on Apple's first sign-in. */
  export type OAuthPayload = { idToken: string; nonce?: string; name?: string };
}

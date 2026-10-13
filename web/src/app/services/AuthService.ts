import { env } from '@app/config/env';
import { Service } from '@app/services/Service';
import type { OAuthProvider } from '@app/types/OAuthProvider';

export class AuthService extends Service {
  static async signUp(payload: AuthService.SignUpPayload): Promise<void> {
    await this.client.post('/auth/sign-up', payload);
  }

  static async verifyEmail(payload: AuthService.VerifyEmailPayload): Promise<AuthService.SessionResponse> {
    const { data } = await this.client.post<AuthService.SessionResponse>('/auth/verify-email', payload);

    return data;
  }

  static async resendVerificationEmail(payload: AuthService.EmailPayload): Promise<void> {
    await this.client.post('/auth/verify-email/resend', payload);
  }

  static async signIn(payload: AuthService.SignInPayload): Promise<AuthService.SessionResponse> {
    const { data } = await this.client.post<AuthService.SessionResponse>('/auth/sign-in', payload);

    return data;
  }

  static async signOut(): Promise<void> {
    await this.client.post('/auth/sign-out');
  }

  static async forgotPassword(payload: AuthService.EmailPayload): Promise<void> {
    await this.client.post('/auth/forgot-password', payload);
  }

  static async resetPassword(payload: AuthService.ResetPasswordPayload): Promise<void> {
    await this.client.post('/auth/reset-password', payload);
  }

  static refresh(): Promise<string> {
    return Service.refreshAccessToken();
  }

  /** Full-page navigation target: the API redirects to the provider and back to /auth/callback. */
  static oauthAuthorizeUrl(provider: OAuthProvider, redirectTo: string): string {
    const url = new URL(`/auth/oauth/${provider}/authorize`, env.VITE_API_URL);

    url.searchParams.set('redirectTo', redirectTo);

    return url.toString();
  }
}

export namespace AuthService {
  export type SessionResponse = { accessToken: string };
  export type EmailPayload = { email: string };
  export type SignUpPayload = { name: string; email: string; password: string };
  export type SignInPayload = { email: string; password: string };
  export type VerifyEmailPayload = { email: string; code: string };
  export type ResetPasswordPayload = { email: string; code: string; password: string };
}

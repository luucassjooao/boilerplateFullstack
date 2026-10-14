import { act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@app/services/AuthService';
import { apiError } from '@test/apiError';
import { renderController } from '@test/renderController';
import { useForgotPasswordController } from '@ui/pages/ForgotPassword/useForgotPasswordController';
import { useOAuthCallbackController } from '@ui/pages/OAuthCallback/useOAuthCallbackController';
import { useResetPasswordController } from '@ui/pages/ResetPassword/useResetPasswordController';
import { useSignUpController } from '@ui/pages/SignUp/useSignUpController';
import { useVerifyEmailController } from '@ui/pages/VerifyEmail/useVerifyEmailController';

type Form = { setValue: (name: any, value: string) => void };

async function fillAndSubmit(controller: () => { form: Form; handleSubmit: () => Promise<void> }, values: Record<string, string>) {
  await act(async () => {
    for (const [key, value] of Object.entries(values)) {
      controller().form.setValue(key, value);
    }
    await controller().handleSubmit();
  });
}

describe('auth page controllers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useSignUpController', () => {
    it('creates the account and goes to email verification', async () => {
      const signUp = vi.spyOn(AuthService, 'signUp').mockResolvedValue();
      const { result } = renderController(useSignUpController, { url: '/sign-up' });

      await fillAndSubmit(() => result.current.controller, { name: 'Ada', email: 'ada@example.com', password: 'password-123' });

      expect(signUp).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', password: 'password-123' });
      expect(result.current.location.pathname).toBe('/verify-email');
    });

    it('rejects short passwords locally and shows API errors', async () => {
      const signUp = vi.spyOn(AuthService, 'signUp').mockRejectedValue(apiError(409, 'EMAIL_ALREADY_IN_USE'));
      const error = vi.spyOn(toast, 'error');
      const { result } = renderController(useSignUpController);

      await fillAndSubmit(() => result.current.controller, { name: 'Ada', email: 'ada@example.com', password: 'short' });
      expect(signUp).not.toHaveBeenCalled();

      await fillAndSubmit(() => result.current.controller, { password: 'password-123' });
      expect(error).toHaveBeenCalledWith('Este email já está cadastrado.');
    });
  });

  describe('useVerifyEmailController', () => {
    it('prefills the email, verifies and starts the session', async () => {
      const verify = vi.spyOn(AuthService, 'verifyEmail').mockResolvedValue({ accessToken: 'token' });
      const { result, auth } = renderController(useVerifyEmailController, { url: '/verify-email?email=ada%40example.com' });

      expect(result.current.controller.form.getValues('email')).toBe('ada@example.com');

      await fillAndSubmit(() => result.current.controller, { code: '123456' });

      expect(verify).toHaveBeenCalledWith({ email: 'ada@example.com', code: '123456' });
      await waitFor(() => expect(auth.startSession).toHaveBeenCalledWith('token'));
    });

    it('shows invalid codes and resends', async () => {
      vi.spyOn(AuthService, 'verifyEmail').mockRejectedValue(apiError(400, 'INVALID_VERIFICATION_CODE'));
      const resend = vi.spyOn(AuthService, 'resendVerificationEmail').mockResolvedValue();
      const error = vi.spyOn(toast, 'error');
      const { result } = renderController(useVerifyEmailController, { url: '/verify-email?email=ada%40example.com' });

      await fillAndSubmit(() => result.current.controller, { code: '000000' });
      await act(() => result.current.controller.handleResend());

      expect(error).toHaveBeenCalledWith('Código inválido ou expirado.');
      expect(resend).toHaveBeenCalledWith({ email: 'ada@example.com' });
    });
  });

  describe('useForgotPasswordController', () => {
    it('requests a code and goes to the reset page', async () => {
      const forgot = vi.spyOn(AuthService, 'forgotPassword').mockResolvedValue();
      const { result } = renderController(useForgotPasswordController);

      await fillAndSubmit(() => result.current.controller, { email: 'ada@example.com' });

      expect(forgot).toHaveBeenCalledWith({ email: 'ada@example.com' });
      expect(result.current.location.pathname).toBe('/reset-password');
      expect(result.current.location.search).toBe('?email=ada%40example.com');
    });
  });

  describe('useResetPasswordController', () => {
    it('resets the password and goes to sign in', async () => {
      const reset = vi.spyOn(AuthService, 'resetPassword').mockResolvedValue();
      const { result } = renderController(useResetPasswordController, { url: '/reset-password?email=ada%40example.com' });

      await fillAndSubmit(() => result.current.controller, { code: '123456', password: 'new-password' });

      expect(reset).toHaveBeenCalledWith({ email: 'ada@example.com', code: '123456', password: 'new-password' });
      expect(result.current.location.pathname).toBe('/sign-in');
    });
  });

  describe('useOAuthCallbackController', () => {
    it('signed in: goes to the (safe) redirect target', () => {
      expect(renderController(useOAuthCallbackController, { url: '/auth/callback?redirectTo=/billing', signedIn: true })
        .result.current.controller.target).toBe('/billing');
      expect(renderController(useOAuthCallbackController, { url: '/auth/callback?redirectTo=//evil.com', signedIn: true })
        .result.current.controller.target).toBe('/');
    });

    it('error from the API: shows its message and goes to sign in', () => {
      const error = vi.spyOn(toast, 'error');
      const { result } = renderController(useOAuthCallbackController, { url: '/auth/callback?error=OAUTH_EMAIL_NOT_VERIFIED' });

      expect(result.current.controller.target).toBe('/sign-in');
      expect(error).toHaveBeenCalledWith(
        'O provedor não confirmou seu email. Use outro método de login.',
        { id: 'oauth-callback-error' },
      );
    });

    it('no session after the boot refresh: treated as failure', () => {
      const { result } = renderController(useOAuthCallbackController, { url: '/auth/callback' });

      expect(result.current.controller.target).toBe('/sign-in');
    });
  });
});

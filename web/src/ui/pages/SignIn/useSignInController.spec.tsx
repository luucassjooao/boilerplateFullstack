import { act, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@app/services/AuthService';
import { apiError } from '@test/apiError';
import { renderController } from '@test/renderController';
import { useSignInController } from '@ui/pages/SignIn/useSignInController';

async function submit(result: { current: { controller: ReturnType<typeof useSignInController> } }, values: object) {
  await act(async () => {
    for (const [key, value] of Object.entries(values)) {
      result.current.controller.form.setValue(key as 'email', value);
    }
    await result.current.controller.handleSubmit();
  });
}

describe('useSignInController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty fields (no hardcoded credentials)', () => {
    const { result } = renderController(useSignInController);

    expect(result.current.controller.form.getValues()).toEqual({ email: '', password: '' });
  });

  it('signs in and starts the session', async () => {
    const signIn = vi.spyOn(AuthService, 'signIn').mockResolvedValue({ accessToken: 'token' });
    const { result, auth } = renderController(useSignInController);

    await submit(result, { email: ' ada@example.com ', password: 'secret' });

    expect(signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret' });
    await waitFor(() => expect(auth.startSession).toHaveBeenCalledWith('token'));
  });

  it('does not call the API with invalid input', async () => {
    const signIn = vi.spyOn(AuthService, 'signIn');
    const { result } = renderController(useSignInController);

    await submit(result, { email: 'nope', password: '' });

    expect(signIn).not.toHaveBeenCalled();
    expect(result.current.controller.form.getFieldState('email').error?.message).toBe('Informe um email válido');
  });

  it('shows the mapped message for invalid credentials', async () => {
    vi.spyOn(AuthService, 'signIn').mockRejectedValue(apiError(401, 'INVALID_CREDENTIALS'));
    const error = vi.spyOn(toast, 'error');
    const { result, auth } = renderController(useSignInController);

    await submit(result, { email: 'ada@example.com', password: 'wrong' });

    expect(error).toHaveBeenCalledWith('Email ou senha inválidos.');
    expect(auth.startSession).not.toHaveBeenCalled();
  });

  it('unverified email: resends the code and goes to the verification page', async () => {
    vi.spyOn(AuthService, 'signIn').mockRejectedValue(apiError(403, 'EMAIL_NOT_VERIFIED'));
    const resend = vi.spyOn(AuthService, 'resendVerificationEmail').mockResolvedValue();
    const { result } = renderController(useSignInController, { url: '/sign-in' });

    await submit(result, { email: 'ada@example.com', password: 'secret' });

    expect(resend).toHaveBeenCalledWith({ email: 'ada@example.com' });
    expect(result.current.location.pathname).toBe('/verify-email');
    expect(result.current.location.search).toBe('?email=ada%40example.com');
  });

  it('exposes only safe redirect targets', () => {
    expect(renderController(useSignInController, { url: '/sign-in?redirectTo=/billing' }).result.current.controller.redirectTo)
      .toBe('/billing');
    expect(renderController(useSignInController, { url: '/sign-in?redirectTo=//evil.com' }).result.current.controller.redirectTo)
      .toBe('/');
  });
});

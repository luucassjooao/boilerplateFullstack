import { act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AuthService } from '@app/services/AuthService';
import { apiError } from '@test/apiError';
import { renderController } from '@test/renderController';
import { useForgotPasswordController } from '@ui/screens/ForgotPassword/useForgotPasswordController';
import { useResetPasswordController } from '@ui/screens/ResetPassword/useResetPasswordController';
import { useSignInController } from '@ui/screens/SignIn/useSignInController';
import { useSignUpController } from '@ui/screens/SignUp/useSignUpController';
import { useVerifyEmailController } from '@ui/screens/VerifyEmail/useVerifyEmailController';

const mockNavigation = { navigate: jest.fn(), popTo: jest.fn() };
let mockRouteParams: Record<string, string> = {};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockRouteParams }),
}));

type Controller = { control: { _formValues: Record<string, unknown> }; handleSubmit: () => Promise<void> };

/** Sets field values through RHF's control and submits. */
async function submit(controller: () => unknown, values: Record<string, string>) {
  await act(async () => {
    const { control, handleSubmit } = controller() as Controller;

    Object.assign(control._formValues, values);
    await handleSubmit();
    // react-query notifies observers on the next tick; flush it inside act.
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('auth screen controllers', () => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockRouteParams = {};
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useSignInController', () => {
    it('signs in and starts the session', async () => {
      const session = { accessToken: 'a', refreshToken: 'r' };
      const signIn = jest.spyOn(AuthService, 'signIn').mockResolvedValue(session);
      const { result, auth } = await renderController(useSignInController);

      await submit(() => result.current, { email: ' ada@example.com ', password: 'secret' });

      expect(signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'secret' });
      expect(auth.startSession).toHaveBeenCalledWith(session, expect.anything(), undefined, expect.anything());
    });

    it('starts with empty fields (no hardcoded credentials)', async () => {
      const { result } = await renderController(useSignInController);

      expect((result.current.control as unknown as Controller['control'])._formValues).toEqual({ email: '', password: '' });
    });

    it('does not call the API with invalid input', async () => {
      const signIn = jest.spyOn(AuthService, 'signIn');
      const { result } = await renderController(useSignInController);

      await submit(() => result.current, { email: 'nope', password: '' });

      expect(signIn).not.toHaveBeenCalled();
    });

    it('shows the mapped message for invalid credentials', async () => {
      jest.spyOn(AuthService, 'signIn').mockRejectedValue(apiError(401, 'INVALID_CREDENTIALS'));
      const { result } = await renderController(useSignInController);

      await submit(() => result.current, { email: 'ada@example.com', password: 'wrong' });

      expect(alert).toHaveBeenCalledWith('Não foi possível entrar', 'Email ou senha inválidos.');
    });

    it('unverified email: resends the code and opens the verification screen', async () => {
      jest.spyOn(AuthService, 'signIn').mockRejectedValue(apiError(403, 'EMAIL_NOT_VERIFIED'));
      const resend = jest.spyOn(AuthService, 'resendVerificationEmail').mockResolvedValue();
      const { result } = await renderController(useSignInController);

      await submit(() => result.current, { email: 'ada@example.com', password: 'secret' });

      expect(resend).toHaveBeenCalledWith({ email: 'ada@example.com' });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyEmail', { email: 'ada@example.com' });
    });
  });

  describe('useSignUpController', () => {
    it('creates the account and opens email verification', async () => {
      const signUp = jest.spyOn(AuthService, 'signUp').mockResolvedValue();
      const { result } = await renderController(useSignUpController);

      await submit(() => result.current, { name: 'Ada', email: 'ada@example.com', password: 'password-123' });

      expect(signUp).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@example.com', password: 'password-123' });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('VerifyEmail', { email: 'ada@example.com' });
    });

    it('shows API errors', async () => {
      jest.spyOn(AuthService, 'signUp').mockRejectedValue(apiError(409, 'EMAIL_ALREADY_IN_USE'));
      const { result } = await renderController(useSignUpController);

      await submit(() => result.current, { name: 'Ada', email: 'ada@example.com', password: 'password-123' });

      expect(alert).toHaveBeenCalledWith('Não foi possível criar a conta', 'Este email já está cadastrado.');
    });
  });

  describe('useVerifyEmailController', () => {
    it('verifies the email from the route and starts the session', async () => {
      mockRouteParams = { email: 'ada@example.com' };
      const session = { accessToken: 'a', refreshToken: 'r' };
      const verify = jest.spyOn(AuthService, 'verifyEmail').mockResolvedValue(session);
      const { result, auth } = await renderController(useVerifyEmailController);

      await submit(() => result.current, { code: '123456' });

      expect(verify).toHaveBeenCalledWith({ email: 'ada@example.com', code: '123456' });
      expect(auth.startSession).toHaveBeenCalled();
    });

    it('resends the code', async () => {
      mockRouteParams = { email: 'ada@example.com' };
      const resend = jest.spyOn(AuthService, 'resendVerificationEmail').mockResolvedValue();
      const { result } = await renderController(useVerifyEmailController);

      await act(() => result.current.handleResend());

      expect(resend).toHaveBeenCalledWith({ email: 'ada@example.com' });
      expect(alert).toHaveBeenCalledWith('Código enviado', expect.any(String));
    });
  });

  describe('useForgotPasswordController + useResetPasswordController', () => {
    it('requests a code, then resets and returns to sign in', async () => {
      jest.spyOn(AuthService, 'forgotPassword').mockResolvedValue();
      const reset = jest.spyOn(AuthService, 'resetPassword').mockResolvedValue();

      const forgot = await renderController(useForgotPasswordController);
      await submit(() => forgot.result.current, { email: 'ada@example.com' });
      expect(mockNavigation.navigate).toHaveBeenCalledWith('ResetPassword', { email: 'ada@example.com' });

      mockRouteParams = { email: 'ada@example.com' };
      const resetController = await renderController(useResetPasswordController);
      await submit(() => resetController.result.current, { code: '123456', password: 'new-password' });

      expect(reset).toHaveBeenCalledWith({ email: 'ada@example.com', code: '123456', password: 'new-password' });
      expect(mockNavigation.popTo).toHaveBeenCalledWith('SignIn');
    });

    it('shows invalid codes', async () => {
      mockRouteParams = { email: 'ada@example.com' };
      jest.spyOn(AuthService, 'resetPassword').mockRejectedValue(apiError(400, 'INVALID_VERIFICATION_CODE'));
      const { result } = await renderController(useResetPasswordController);

      await submit(() => result.current, { code: '000000', password: 'new-password' });

      expect(alert).toHaveBeenCalledWith('Não foi possível alterar a senha', 'Código inválido ou expirado.');
      expect(mockNavigation.popTo).not.toHaveBeenCalled();
    });
  });
});

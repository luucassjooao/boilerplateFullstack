import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { AuthService } from '@app/services/AuthService';

export function useSignIn() {
  const { startSession } = useAuth();

  return useMutation({
    mutationFn: (payload: AuthService.SignInPayload) => AuthService.signIn(payload),
    onSuccess: ({ accessToken }) => startSession(accessToken),
  });
}

export function useSignUp() {
  return useMutation({ mutationFn: (payload: AuthService.SignUpPayload) => AuthService.signUp(payload) });
}

export function useVerifyEmail() {
  const { startSession } = useAuth();

  return useMutation({
    mutationFn: (payload: AuthService.VerifyEmailPayload) => AuthService.verifyEmail(payload),
    onSuccess: ({ accessToken }) => startSession(accessToken),
  });
}

export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: (payload: AuthService.EmailPayload) => AuthService.resendVerificationEmail(payload),
  });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: (payload: AuthService.EmailPayload) => AuthService.forgotPassword(payload) });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: AuthService.ResetPasswordPayload) => AuthService.resetPassword(payload),
  });
}

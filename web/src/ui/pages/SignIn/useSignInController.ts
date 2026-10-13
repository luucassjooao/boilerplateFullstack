import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useResendVerificationEmail, useSignIn } from '@app/hooks/mutations/authMutations';
import { getErrorCode, getErrorMessage } from '@app/lib/errorMessages';
import { safeRedirect } from '@app/lib/safeRedirect';
import { signInSchema, type SignInFormData } from '@ui/pages/SignIn/schema';

export function useSignInController() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const signIn = useSignIn();
  const resendVerificationEmail = useResendVerificationEmail();
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // After sign in, AuthGuard sends the user to `redirectTo`.
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await signIn.mutateAsync(data);
    } catch (error) {
      if (getErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        await resendVerificationEmail.mutateAsync({ email: data.email }).catch(() => {});
        toast.info('Enviamos um código para confirmar seu email.');
        navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);

        return;
      }

      toast.error(getErrorMessage(error));
    }
  });

  return {
    form,
    handleSubmit,
    isLoading: signIn.isPending,
    redirectTo: safeRedirect(searchParams.get('redirectTo')),
  };
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useResendVerificationEmail, useVerifyEmail } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import { verifyEmailSchema, type VerifyEmailFormData } from '@ui/pages/VerifyEmail/schema';

export function useVerifyEmailController() {
  const [searchParams] = useSearchParams();
  const verifyEmail = useVerifyEmail();
  const resendVerificationEmail = useResendVerificationEmail();
  const form = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: searchParams.get('email') ?? '', code: '' },
  });

  // Success starts the session; AuthGuard then leaves the auth pages.
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await verifyEmail.mutateAsync(data);
      toast.success('Email confirmado!');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  async function handleResend() {
    const isValid = await form.trigger('email');

    if (!isValid) {
      return;
    }

    try {
      await resendVerificationEmail.mutateAsync({ email: form.getValues('email') });
      toast.success('Se o email estiver pendente de confirmação, enviamos um novo código.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return {
    form,
    handleSubmit,
    handleResend,
    isLoading: verifyEmail.isPending,
    isResending: resendVerificationEmail.isPending,
  };
}

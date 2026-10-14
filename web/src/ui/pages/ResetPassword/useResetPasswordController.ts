import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useResetPassword } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import { resetPasswordSchema, type ResetPasswordFormData } from '@ui/pages/ResetPassword/schema';

export function useResetPasswordController() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: searchParams.get('email') ?? '', code: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await resetPassword.mutateAsync(data);
      toast.success('Senha alterada! Entre com a nova senha.');
      navigate('/sign-in');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return { form, handleSubmit, isLoading: resetPassword.isPending };
}

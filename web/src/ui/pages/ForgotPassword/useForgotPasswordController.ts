import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useForgotPassword } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@ui/pages/ForgotPassword/schema';

export function useForgotPasswordController() {
  const navigate = useNavigate();
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await forgotPassword.mutateAsync(data);
      // The API never says whether the email exists, and neither does the UI.
      toast.success('Se existir uma conta com esse email, enviamos um código.');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return { form, handleSubmit, isLoading: forgotPassword.isPending };
}

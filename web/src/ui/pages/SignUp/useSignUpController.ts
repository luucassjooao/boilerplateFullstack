import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useSignUp } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import { signUpSchema, type SignUpFormData } from '@ui/pages/SignUp/schema';

export function useSignUpController() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await signUp.mutateAsync(data);
      toast.success('Conta criada! Enviamos um código para o seu email.');
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  });

  return { form, handleSubmit, isLoading: signUp.isPending };
}

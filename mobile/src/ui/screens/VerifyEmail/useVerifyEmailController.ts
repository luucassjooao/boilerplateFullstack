import { zodResolver } from '@hookform/resolvers/zod';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useResendVerificationEmail, useVerifyEmail } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import type { AuthStackParamList } from '@app/navigation/types';
import { verifyEmailSchema, type VerifyEmailFormData } from '@ui/screens/VerifyEmail/schema';

export function useVerifyEmailController() {
  const { params } = useRoute<RouteProp<AuthStackParamList, 'VerifyEmail'>>();
  const verifyEmail = useVerifyEmail();
  const resendVerificationEmail = useResendVerificationEmail();
  const form = useForm<VerifyEmailFormData>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { code: '' },
  });

  // Success starts the session; RootStack swaps to the app stack.
  const handleSubmit = form.handleSubmit(async ({ code }) => {
    try {
      await verifyEmail.mutateAsync({ email: params.email, code });
    } catch (error) {
      Alert.alert('Não foi possível confirmar', getErrorMessage(error));
    }
  });

  async function handleResend() {
    try {
      await resendVerificationEmail.mutateAsync({ email: params.email });
      Alert.alert('Código enviado', 'Se o email estiver pendente de confirmação, enviamos um novo código.');
    } catch (error) {
      Alert.alert('Não foi possível reenviar', getErrorMessage(error));
    }
  }

  return {
    email: params.email,
    control: form.control,
    handleSubmit,
    handleResend,
    isLoading: verifyEmail.isPending,
    isResending: resendVerificationEmail.isPending,
  };
}

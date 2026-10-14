import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useResendVerificationEmail, useSignIn } from '@app/hooks/mutations/authMutations';
import { getErrorCode, getErrorMessage } from '@app/lib/errorMessages';
import type { AuthNavigation } from '@app/navigation/types';
import { signInSchema, type SignInFormData } from '@ui/screens/SignIn/schema';

export function useSignInController() {
  const navigation = useNavigation<AuthNavigation>();
  const signIn = useSignIn();
  const resendVerificationEmail = useResendVerificationEmail();
  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  // Success flips `signedIn`, and RootStack swaps to the app stack.
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await signIn.mutateAsync(data);
    } catch (error) {
      if (getErrorCode(error) === 'EMAIL_NOT_VERIFIED') {
        await resendVerificationEmail.mutateAsync({ email: data.email }).catch(() => {});
        navigation.navigate('VerifyEmail', { email: data.email });

        return;
      }

      Alert.alert('Não foi possível entrar', getErrorMessage(error));
    }
  });

  return {
    control: form.control,
    handleSubmit,
    isLoading: signIn.isPending,
    goToForgotPassword: () => navigation.navigate('ForgotPassword'),
  };
}

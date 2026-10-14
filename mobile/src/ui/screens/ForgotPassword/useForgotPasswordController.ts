import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useForgotPassword } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import type { AuthNavigation } from '@app/navigation/types';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@ui/screens/ForgotPassword/schema';

export function useForgotPasswordController() {
  const navigation = useNavigation<AuthNavigation>();
  const forgotPassword = useForgotPassword();
  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // The API never says whether the email exists, and neither does the app.
      await forgotPassword.mutateAsync(data);
      navigation.navigate('ResetPassword', { email: data.email });
    } catch (error) {
      Alert.alert('Não foi possível enviar', getErrorMessage(error));
    }
  });

  return { control: form.control, handleSubmit, isLoading: forgotPassword.isPending };
}

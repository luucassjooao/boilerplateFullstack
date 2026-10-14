import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useResetPassword } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import type { AuthNavigation, AuthStackParamList } from '@app/navigation/types';
import { resetPasswordSchema, type ResetPasswordFormData } from '@ui/screens/ResetPassword/schema';

export function useResetPasswordController() {
  const navigation = useNavigation<AuthNavigation>();
  const { params } = useRoute<RouteProp<AuthStackParamList, 'ResetPassword'>>();
  const resetPassword = useResetPassword();
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await resetPassword.mutateAsync({ email: params.email, ...data });
      Alert.alert('Senha alterada', 'Entre com a nova senha.');
      navigation.popTo('SignIn');
    } catch (error) {
      Alert.alert('Não foi possível alterar a senha', getErrorMessage(error));
    }
  });

  return { email: params.email, control: form.control, handleSubmit, isLoading: resetPassword.isPending };
}

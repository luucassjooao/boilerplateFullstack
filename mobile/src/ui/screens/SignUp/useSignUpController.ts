import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useSignUp } from '@app/hooks/mutations/authMutations';
import { getErrorMessage } from '@app/lib/errorMessages';
import type { AuthNavigation } from '@app/navigation/types';
import { signUpSchema, type SignUpFormData } from '@ui/screens/SignUp/schema';

export function useSignUpController() {
  const navigation = useNavigation<AuthNavigation>();
  const signUp = useSignUp();
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await signUp.mutateAsync(data);
      navigation.navigate('VerifyEmail', { email: data.email });
    } catch (error) {
      Alert.alert('Não foi possível criar a conta', getErrorMessage(error));
    }
  });

  return { control: form.control, handleSubmit, isLoading: signUp.isPending };
}

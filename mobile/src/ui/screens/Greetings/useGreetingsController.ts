import { useNavigation } from '@react-navigation/native';
import type { AuthNavigation } from '@app/navigation/types';

export function useGreetingsController() {
  const navigation = useNavigation<AuthNavigation>();

  return {
    goToSignUp: () => navigation.navigate('SignUp'),
    goToSignIn: () => navigation.navigate('SignIn'),
  };
}

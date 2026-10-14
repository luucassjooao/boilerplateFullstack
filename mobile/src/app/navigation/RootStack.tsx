import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { AppStack } from '@app/navigation/AppStack';
import { AuthStack } from '@app/navigation/AuthStack';

/** Switching stacks on `signedIn` resets navigation: no back button into auth screens after sign in. */
export function RootStack() {
  const { signedIn } = useAuth();

  return signedIn ? <AppStack /> : <AuthStack />;
}

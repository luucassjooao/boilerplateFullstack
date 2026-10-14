import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@app/navigation/types';
import { ForgotPassword } from '@ui/screens/ForgotPassword';
import { Greetings } from '@ui/screens/Greetings';
import { ResetPassword } from '@ui/screens/ResetPassword';
import { SignIn } from '@ui/screens/SignIn';
import { SignUp } from '@ui/screens/SignUp';
import { VerifyEmail } from '@ui/screens/VerifyEmail';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
      <Stack.Screen name="Greetings" component={Greetings} options={{ headerShown: false }} />
      <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Entrar' }} />
      <Stack.Screen name="SignUp" component={SignUp} options={{ title: 'Criar conta' }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmail} options={{ title: 'Confirmar email' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ title: 'Esqueci minha senha' }} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} options={{ title: 'Nova senha' }} />
    </Stack.Navigator>
  );
}

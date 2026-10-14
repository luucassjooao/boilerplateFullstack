import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Greetings: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
};

export type AppStackParamList = {
  Home: undefined;
};

export type AuthNavigation = NativeStackNavigationProp<AuthStackParamList>;

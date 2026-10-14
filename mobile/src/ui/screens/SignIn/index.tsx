import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { FormInput } from '@ui/components/FormInput';
import { Screen } from '@ui/components/Screen';
import { SocialSignInButtons } from '@ui/components/SocialSignInButtons';
import { styles } from '@ui/screens/SignIn/styles';
import { useSignInController } from '@ui/screens/SignIn/useSignInController';

export function SignIn() {
  const { control, handleSubmit, isLoading, goToForgotPassword } = useSignInController();

  return (
    <Screen>
      <FormInput
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormInput
        control={control}
        name="password"
        label="Senha"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => void handleSubmit()}
      />
      <AppText size="sm" style={styles.forgot} onPress={goToForgotPassword} accessibilityRole="link">
        Esqueci minha senha
      </AppText>
      <Button isLoading={isLoading} onPress={() => void handleSubmit()}>Entrar</Button>
      <SocialSignInButtons />
    </Screen>
  );
}

import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { FormInput } from '@ui/components/FormInput';
import { Screen } from '@ui/components/Screen';
import { useResetPasswordController } from '@ui/screens/ResetPassword/useResetPasswordController';

export function ResetPassword() {
  const { email, control, handleSubmit, isLoading } = useResetPasswordController();

  return (
    <Screen>
      <AppText color="muted">Use o código enviado para {email}.</AppText>
      <FormInput
        control={control}
        name="code"
        label="Código"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <FormInput
        control={control}
        name="password"
        label="Nova senha"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button isLoading={isLoading} onPress={() => void handleSubmit()}>Alterar senha</Button>
    </Screen>
  );
}

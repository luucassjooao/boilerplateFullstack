import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { FormInput } from '@ui/components/FormInput';
import { Screen } from '@ui/components/Screen';
import { useForgotPasswordController } from '@ui/screens/ForgotPassword/useForgotPasswordController';

export function ForgotPassword() {
  const { control, handleSubmit, isLoading } = useForgotPasswordController();

  return (
    <Screen>
      <AppText color="muted">Enviaremos um código para você criar uma nova senha.</AppText>
      <FormInput
        control={control}
        name="email"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <Button isLoading={isLoading} onPress={() => void handleSubmit()}>Enviar código</Button>
    </Screen>
  );
}

import { AppText } from '@ui/components/AppText';
import { Button } from '@ui/components/Button';
import { FormInput } from '@ui/components/FormInput';
import { Screen } from '@ui/components/Screen';
import { useVerifyEmailController } from '@ui/screens/VerifyEmail/useVerifyEmailController';

export function VerifyEmail() {
  const { email, control, handleSubmit, handleResend, isLoading, isResending } = useVerifyEmailController();

  return (
    <Screen>
      <AppText color="muted">Digite o código de 6 dígitos enviado para {email}.</AppText>
      <FormInput
        control={control}
        name="code"
        label="Código"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <Button isLoading={isLoading} onPress={() => void handleSubmit()}>Confirmar</Button>
      <Button variant="ghost" isLoading={isResending} onPress={() => void handleResend()}>Reenviar código</Button>
    </Screen>
  );
}

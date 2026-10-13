import { Button } from '@ui/components/Button';
import { FormInput } from '@ui/components/FormInput';
import { Screen } from '@ui/components/Screen';
import { useSignUpController } from '@ui/screens/SignUp/useSignUpController';

export function SignUp() {
  const { control, handleSubmit, isLoading } = useSignUpController();

  return (
    <Screen>
      <FormInput control={control} name="name" label="Nome" autoComplete="name" textContentType="name" />
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
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Button isLoading={isLoading} onPress={() => void handleSubmit()}>Criar conta</Button>
    </Screen>
  );
}

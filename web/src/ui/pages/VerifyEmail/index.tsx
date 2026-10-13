import { FormField } from '@ui/components/FormField';
import { Button } from '@ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/ui/card';
import { Input } from '@ui/components/ui/input';
import { useVerifyEmailController } from '@ui/pages/VerifyEmail/useVerifyEmailController';

export default function VerifyEmail() {
  const { form, handleSubmit, handleResend, isLoading, isResending } = useVerifyEmailController();
  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirme seu email</CardTitle>
        <CardDescription>Digite o código de 6 dígitos que enviamos para você.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField id="code" label="Código" error={errors.code?.message}>
            <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...form.register('code')} />
          </FormField>
          <Button type="submit" disabled={isLoading}>Confirmar</Button>
          <Button type="button" variant="ghost" disabled={isResending} onClick={() => void handleResend()}>
            Reenviar código
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

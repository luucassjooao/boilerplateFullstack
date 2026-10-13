import { FormField } from '@ui/components/FormField';
import { Button } from '@ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/ui/card';
import { Input } from '@ui/components/ui/input';
import { useResetPasswordController } from '@ui/pages/ResetPassword/useResetPasswordController';

export default function ResetPassword() {
  const { form, handleSubmit, isLoading } = useResetPasswordController();
  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova senha</CardTitle>
        <CardDescription>Use o código que enviamos para o seu email.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField id="code" label="Código" error={errors.code?.message}>
            <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...form.register('code')} />
          </FormField>
          <FormField id="password" label="Nova senha" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <Button type="submit" disabled={isLoading}>Alterar senha</Button>
        </form>
      </CardContent>
    </Card>
  );
}

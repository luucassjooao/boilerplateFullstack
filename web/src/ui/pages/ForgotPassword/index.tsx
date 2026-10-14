import { Link } from 'react-router';
import { FormField } from '@ui/components/FormField';
import { Button } from '@ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/ui/card';
import { Input } from '@ui/components/ui/input';
import { useForgotPasswordController } from '@ui/pages/ForgotPassword/useForgotPasswordController';

export default function ForgotPassword() {
  const { form, handleSubmit, isLoading } = useForgotPasswordController();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Esqueci minha senha</CardTitle>
        <CardDescription>Enviaremos um código para você criar uma nova senha.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormField id="email" label="Email" error={form.formState.errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <Button type="submit" disabled={isLoading}>Enviar código</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm">
        <Link to="/sign-in" className="underline underline-offset-4">Voltar para o login</Link>
      </CardFooter>
    </Card>
  );
}

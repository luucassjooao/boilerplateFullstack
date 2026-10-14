import { Link } from 'react-router';
import { FormField } from '@ui/components/FormField';
import { OAuthButtons } from '@ui/components/OAuthButtons';
import { Button } from '@ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/ui/card';
import { Input } from '@ui/components/ui/input';
import { useSignUpController } from '@ui/pages/SignUp/useSignUpController';

export default function SignUp() {
  const { form, handleSubmit, isLoading } = useSignUpController();
  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Leva menos de um minuto</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormField id="name" label="Nome" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...form.register('name')} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField id="password" label="Senha" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <Button type="submit" disabled={isLoading}>Criar conta</Button>
        </form>
        <OAuthButtons redirectTo="/" />
      </CardContent>
      <CardFooter className="justify-center text-sm">
        Já tem conta?&nbsp;<Link to="/sign-in" className="underline underline-offset-4">Entrar</Link>
      </CardFooter>
    </Card>
  );
}

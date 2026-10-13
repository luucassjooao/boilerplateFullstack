import { Link } from 'react-router';
import { FormField } from '@ui/components/FormField';
import { OAuthButtons } from '@ui/components/OAuthButtons';
import { Button } from '@ui/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@ui/components/ui/card';
import { Input } from '@ui/components/ui/input';
import { useSignInController } from '@ui/pages/SignIn/useSignInController';

export default function SignIn() {
  const { form, handleSubmit, isLoading, redirectTo } = useSignInController();
  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          </FormField>
          <FormField id="password" label="Senha" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          </FormField>
          <Link to="/forgot-password" className="justify-self-end text-sm underline-offset-4 hover:underline">
            Esqueci minha senha
          </Link>
          <Button type="submit" disabled={isLoading}>Entrar</Button>
        </form>
        <OAuthButtons redirectTo={redirectTo} />
      </CardContent>
      <CardFooter className="justify-center text-sm">
        Não tem conta?&nbsp;<Link to="/sign-up" className="underline underline-offset-4">Criar conta</Link>
      </CardFooter>
    </Card>
  );
}

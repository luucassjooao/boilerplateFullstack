import { SplashScreen } from '@ui/components/SplashScreen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/ui/card';
import { useHomeController } from '@ui/pages/Home/useHomeController';

export default function Home() {
  const { me, isLoading } = useHomeController();

  if (isLoading || !me) {
    return <SplashScreen />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Olá, {me.name}!</CardTitle>
        <CardDescription>Você está autenticado.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1 text-sm">
        <p><span className="text-muted-foreground">Email:</span> {me.email}</p>
        <p><span className="text-muted-foreground">Email confirmado:</span> {me.emailVerified ? 'sim' : 'não'}</p>
        <p>
          <span className="text-muted-foreground">Login social:</span>{' '}
          {me.providers.length > 0 ? me.providers.join(', ') : 'nenhum'}
        </p>
      </CardContent>
    </Card>
  );
}

import { LoaderCircle } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Carregando">
      <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
    </div>
  );
}

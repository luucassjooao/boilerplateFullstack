import { LogOut } from 'lucide-react';
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { SplashScreen } from '@ui/components/SplashScreen';
import { Button } from '@ui/components/ui/button';

export function AppLayout() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-svh">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold">App</span>
        <Button variant="ghost" size="sm" onClick={() => void signOut()}>
          <LogOut /> Sair
        </Button>
      </header>
      <main className="mx-auto max-w-3xl p-6">
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

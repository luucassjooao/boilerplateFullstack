import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { SplashScreen } from '@ui/components/SplashScreen';

export function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  );
}

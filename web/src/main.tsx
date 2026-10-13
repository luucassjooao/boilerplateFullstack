import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from '@app/contexts/AuthContext/AuthProvider';
import { queryClient } from '@app/lib/queryClient';
import { router } from '@router/index';
import { ErrorBoundary } from '@ui/components/ErrorBoundary';
import { Toaster } from '@ui/components/ui/sonner';
import './index.css';

// After a deploy, old lazy chunks disappear: reload to fetch the new build (at most once a minute).
window.addEventListener('vite:preloadError', () => {
  const key = 'last-preload-error-reload';
  const last = Number(sessionStorage.getItem(key) ?? 0);

  if (Date.now() - last > 60_000) {
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);

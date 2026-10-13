import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@app/contexts/AuthContext/AuthContext';
import { meQueryKey } from '@app/hooks/queries/useMe';
import { accessTokenStore } from '@app/lib/accessTokenStore';
import { AccountsService } from '@app/services/AccountsService';
import { AuthService } from '@app/services/AuthService';
import { Service } from '@app/services/Service';
import { SplashScreen } from '@ui/components/SplashScreen';

type Status = 'loading' | 'signedIn' | 'signedOut';

/**
 * Boot: one /auth/refresh (the refresh cookie survives reloads; the access token does not).
 * While it runs, a splash screen. Success → signed in (and /me is prefetched); failure → signed out.
 * This also completes the web OAuth flow: /auth/callback loads with the fresh refresh cookie.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');

  const endSession = useCallback(() => {
    accessTokenStore.clear();
    queryClient.clear();
    setStatus('signedOut');
  }, [queryClient]);

  const startSession = useCallback((accessToken: string) => {
    accessTokenStore.set(accessToken);
    setStatus('signedIn');
    void queryClient.prefetchQuery({ queryKey: meQueryKey, queryFn: () => AccountsService.me() });
  }, [queryClient]);

  useEffect(() => Service.onSessionExpired(endSession), [endSession]);

  useEffect(() => {
    // StrictMode runs this twice in dev: the single-flight refresh dedupes it.
    AuthService.refresh()
      .then(startSession)
      .catch(() => setStatus('signedOut'));
  }, [startSession]);

  const value = useMemo<AuthContextValue>(() => ({
    signedIn: status === 'signedIn',
    startSession,
    signOut: async () => {
      try {
        await AuthService.signOut();
      } finally {
        endSession();
      }
    },
  }), [status, startSession, endSession]);

  if (status === 'loading') {
    return <SplashScreen />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useQueryClient } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@app/contexts/AuthContext/AuthContext';
import { AuthTokensManager } from '@app/lib/AuthTokensManager';
import { AuthService } from '@app/services/AuthService';
import { Service } from '@app/services/Service';

type Status = 'loading' | 'signedIn' | 'signedOut';

/**
 * Boot: with a stored refresh token, one /auth/refresh; the splash screen stays up until it resolves.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>('loading');

  const endSession = useCallback(async () => {
    await AuthTokensManager.clear();
    queryClient.clear();
    setStatus('signedOut');
  }, [queryClient]);

  useEffect(() => Service.onSessionExpired(() => void endSession()), [endSession]);

  useEffect(() => {
    AuthService.refresh()
      .then(() => setStatus('signedIn'))
      // No stored token, revoked family or network error: start signed out.
      .catch(() => setStatus('signedOut'));
  }, []);

  useEffect(() => {
    if (status !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [status]);

  const value = useMemo<AuthContextValue>(() => ({
    signedIn: status === 'signedIn',
    startSession: async (session) => {
      await AuthTokensManager.save(session);
      setStatus('signedIn');
    },
    signOut: async () => {
      const refreshToken = await AuthTokensManager.getRefreshToken();

      try {
        if (refreshToken) {
          await AuthService.signOut(refreshToken);
        }
      } catch {
        // Offline or already revoked: still sign out locally.
      } finally {
        await endSession();
      }
    },
  }), [status, endSession]);

  if (status === 'loading') {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

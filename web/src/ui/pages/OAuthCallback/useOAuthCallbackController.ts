import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { getMessageForCode } from '@app/lib/errorMessages';
import { safeRedirect } from '@app/lib/safeRedirect';

/**
 * The API redirects here after OAuth with the refresh cookie set (or `?error=CODE`).
 * AuthProvider's boot already called /auth/refresh, so by now we only need to read the result.
 */
export function useOAuthCallbackController() {
  const [searchParams] = useSearchParams();
  const { signedIn } = useAuth();
  const error = searchParams.get('error') ?? (signedIn ? null : 'OAUTH_FAILED');

  useEffect(() => {
    if (error) {
      // Fixed id: StrictMode runs effects twice in dev.
      toast.error(getMessageForCode(error), { id: 'oauth-callback-error' });
    }
  }, [error]);

  return { target: error ? '/sign-in' : safeRedirect(searchParams.get('redirectTo')) };
}

import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { safeRedirect } from '@app/lib/safeRedirect';

/** Private routes need a session; public (auth) routes send signed-in users to `redirectTo`. */
export function AuthGuard({ isPrivate }: { isPrivate: boolean }) {
  const { signedIn } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  if (isPrivate && !signedIn) {
    const redirectTo = encodeURIComponent(location.pathname + location.search);

    return <Navigate to={`/sign-in?redirectTo=${redirectTo}`} replace />;
  }

  if (!isPrivate && signedIn) {
    return <Navigate to={safeRedirect(searchParams.get('redirectTo'))} replace />;
  }

  return <Outlet />;
}

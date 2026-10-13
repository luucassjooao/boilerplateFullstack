import { Navigate } from 'react-router';
import { useOAuthCallbackController } from '@ui/pages/OAuthCallback/useOAuthCallbackController';

export default function OAuthCallback() {
  const { target } = useOAuthCallbackController();

  return <Navigate to={target} replace />;
}

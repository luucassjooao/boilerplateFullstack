import { AuthService } from '@app/services/AuthService';
import { Button } from '@ui/components/ui/button';

/** Full-page navigation to the API, which redirects to the provider and back to /auth/callback. */
export function OAuthButtons({ redirectTo }: { redirectTo: string }) {
  return (
    <div className="grid gap-2">
      <Button variant="outline" asChild>
        <a href={AuthService.oauthAuthorizeUrl('google', redirectTo)}>Continuar com Google</a>
      </Button>
      <Button variant="outline" asChild>
        <a href={AuthService.oauthAuthorizeUrl('apple', redirectTo)}>Continuar com Apple</a>
      </Button>
    </div>
  );
}

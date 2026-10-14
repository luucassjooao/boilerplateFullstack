import { createContext } from 'react';
import type { AuthService } from '@app/services/AuthService';

export type AuthContextValue = {
  signedIn: boolean;
  /** Persists the tokens and flips the app to signed in. */
  startSession: (session: AuthService.Session) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

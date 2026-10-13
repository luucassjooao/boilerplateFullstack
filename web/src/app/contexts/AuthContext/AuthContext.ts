import { createContext } from 'react';

export type AuthContextValue = {
  signedIn: boolean;
  /** Stores the access token in memory and flips the app to signed in. */
  startSession: (accessToken: string) => void;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

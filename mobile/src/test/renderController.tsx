import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AuthContext, type AuthContextValue } from '@app/contexts/AuthContext/AuthContext';

/** Renders a screen controller with react-query and a fake auth context (navigation is mocked per test). */
export async function renderController<T>(useController: () => T) {
  const auth: AuthContextValue = {
    signedIn: false,
    startSession: jest.fn(async () => {}),
    signOut: jest.fn(async () => {}),
  };
  // gcTime Infinity: no garbage-collection timers left running, so Jest can exit.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  return { ...(await renderHook(useController, { wrapper: Wrapper })), auth };
}

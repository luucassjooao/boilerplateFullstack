import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router';
import { vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@app/contexts/AuthContext/AuthContext';

/** Renders a page controller with router, react-query and a fake auth context. */
export function renderController<T>(useController: () => T, { url = '/', signedIn = false } = {}) {
  const auth: AuthContextValue = {
    signedIn,
    startSession: vi.fn(),
    signOut: vi.fn(),
  };
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>
          <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  }

  const rendered = renderHook(() => ({ controller: useController(), location: useLocation() }), { wrapper: Wrapper });

  return { ...rendered, auth };
}

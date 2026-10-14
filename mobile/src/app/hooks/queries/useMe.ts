import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { AccountsService } from '@app/services/AccountsService';

export const meQueryKey = ['me'] as const;

export function useMe() {
  const { signedIn } = useAuth();

  return useQuery({ queryKey: meQueryKey, queryFn: () => AccountsService.me(), enabled: signedIn });
}

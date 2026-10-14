import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { useMe } from '@app/hooks/queries/useMe';

export function useHomeController() {
  const { signOut } = useAuth();
  const { data: me, isLoading } = useMe();

  return { me, isLoading, signOut };
}

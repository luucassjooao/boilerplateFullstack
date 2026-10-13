import { useMe } from '@app/hooks/queries/useMe';

export function useHomeController() {
  const { data: me, isLoading } = useMe();

  return { me, isLoading };
}

import { useQuery } from '@tanstack/react-query';
import { fetchMyStats, RunStats } from './stats';

export function useMyStats() {
  return useQuery<RunStats | null>({
    queryKey: ['myStats'],
    queryFn: fetchMyStats,
  });
}

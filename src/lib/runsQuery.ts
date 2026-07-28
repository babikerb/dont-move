import { useQuery } from '@tanstack/react-query';
import { fetchMyRuns, RunHistoryEntry } from './runs';

export function useMyRuns() {
  return useQuery<RunHistoryEntry[]>({
    queryKey: ['myRuns'],
    queryFn: () => fetchMyRuns(),
  });
}

import { useQuery } from '@tanstack/react-query';
import { supabase, isAnonymousSession } from './supabase';
import { fetchLeaderboard, fetchMyRank, LeaderboardEntry, LeaderboardWindow, MyRank } from './leaderboard';

export const LEADERBOARD_QUERY_KEY = 'leaderboard' as const;

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  myRank: MyRank | null;
  myUserId: string | null;
  isGuest: boolean;
}

async function fetchLeaderboardData(window: LeaderboardWindow): Promise<LeaderboardData> {
  const [{ data }, entries, myRank, isGuest] = await Promise.all([
    supabase.auth.getSession(),
    fetchLeaderboard(window),
    fetchMyRank(window),
    isAnonymousSession(),
  ]);

  return {
    entries,
    myRank,
    myUserId: data.session?.user.id ?? null,
    isGuest,
  };
}

// Shorter staleTime than the app default: this screen is meant to feel
// live. The Realtime subscription (see LeaderboardScreen) invalidates this
// on every new run anyway, so staleness rarely lasts long in practice -
// this mainly avoids a redundant refetch on a quick tab-away-tab-back.
export function useLeaderboard(window: LeaderboardWindow) {
  return useQuery({
    queryKey: [LEADERBOARD_QUERY_KEY, window],
    queryFn: () => fetchLeaderboardData(window),
    staleTime: 30_000,
  });
}

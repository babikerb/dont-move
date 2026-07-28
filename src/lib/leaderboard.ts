import { supabase } from './supabase';

export type LeaderboardWindow = 'today' | 'week' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  avatarId: string;
  isDev: boolean;
  score: number;
  createdAt: string;
}

export interface MyRank {
  rank: number;
  score: number;
  total: number;
}

// Percentile of a score against the distribution of every player's best
// score (CLAUDE.md: "Only the user's highest score counts"). Returns null on
// any failure (offline, RPC error) so callers can fall back to the static
// estimate in percentile.ts rather than surface an error on the Results
// screen.
export async function fetchScorePercentile(score: number): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_score_percentile', { target_score: score });
  if (error || data === null) return null;
  return Number(data);
}

export async function fetchLeaderboard(
  window: LeaderboardWindow,
  limit = 50
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_window: window,
    p_limit: limit,
  });
  if (error || !data) return [];

  return data.map((row: any) => ({
    rank: Number(row.rank),
    userId: row.user_id,
    username: row.username,
    avatarId: row.avatar_id,
    isDev: row.is_dev ?? false,
    score: Number(row.score),
    createdAt: row.created_at,
  }));
}

export async function fetchMyRank(window: LeaderboardWindow): Promise<MyRank | null> {
  const { data, error } = await supabase.rpc('get_my_leaderboard_rank', { p_window: window });
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return { rank: Number(row.rank), score: Number(row.score), total: Number(row.total) };
}

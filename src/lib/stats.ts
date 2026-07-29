import { supabase } from './supabase';
import { getBestScore, getRunHistory } from './storage';

export interface RunStats {
  totalRuns: number;
  bestScore: number | null;
  averageScore: number | null;
  firstRunAt: string | null;
}

// Guests have no session to aggregate server-side, but CLAUDE.md's First Run
// Experience promises stats "available immediately" without an account -
// this mirrors that shape from the local run history (capped at storage.ts's
// MAX_HISTORY, so very active guests get an approximation of totalRuns/
// averageScore/firstRunAt until they sign in, same tradeoff Home already
// accepts for bestScore).
async function fetchLocalStats(): Promise<RunStats | null> {
  const history = await getRunHistory();
  if (history.length === 0) return null;

  const bestScore = await getBestScore();
  const totalScore = history.reduce((sum, run) => sum + run.score, 0);

  return {
    totalRuns: history.length,
    bestScore,
    averageScore: totalScore / history.length,
    firstRunAt: history[history.length - 1].createdAt,
  };
}

// Aggregated server-side (get_my_stats is SECURITY INVOKER, so it's just the
// caller's own RLS-scoped rows) rather than pulling every run to the client.
export async function fetchMyStats(): Promise<RunStats | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return fetchLocalStats();

  const { data, error } = await supabase.rpc('get_my_stats');
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    totalRuns: Number(row.total_runs),
    bestScore: row.best_score !== null ? Number(row.best_score) : null,
    averageScore: row.average_score !== null ? Number(row.average_score) : null,
    firstRunAt: row.first_run_at,
  };
}

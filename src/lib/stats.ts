import { supabase } from './supabase';

export interface RunStats {
  totalRuns: number;
  bestScore: number | null;
  averageScore: number | null;
  firstRunAt: string | null;
}

// Aggregated server-side (get_my_stats is SECURITY INVOKER, so it's just the
// caller's own RLS-scoped rows) rather than pulling every run to the client.
// Guests (no session) skip the network round trip entirely - there's
// nothing server-side to fetch, and the RPC is restricted to authenticated
// callers anyway.
export async function fetchMyStats(): Promise<RunStats | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;

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

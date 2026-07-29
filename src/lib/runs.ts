import { supabase } from './supabase';
import { getRunHistory } from './storage';

export interface RunHistoryEntry {
  id: string;
  score: number;
  movementScore: number;
  duration: number;
  createdAt: string;
}

// Every run is a fixed 20-second duration (see CLAUDE.md's Gameplay spec) -
// storage.ts's StoredRun doesn't bother persisting it locally, so this
// fallback hardcodes the same value accountMigration.ts uses when it
// uploads this same local history on sign-in.
const RUN_DURATION_SECONDS = 20;

// Mirrors fetchMyStats' guest fallback: no session means nothing server-side
// to query, so this reads the same local history Run History would
// otherwise show as empty for a guest who's actually been playing.
async function fetchLocalRuns(limit: number): Promise<RunHistoryEntry[]> {
  const history = await getRunHistory();
  return history.slice(0, limit).map((run, index) => ({
    id: `local-${index}-${run.createdAt}`,
    score: run.score,
    movementScore: run.movementScore,
    duration: RUN_DURATION_SECONDS,
    createdAt: run.createdAt,
  }));
}

// public.runs RLS already scopes SELECT to the caller's own rows
// (auth.uid() = user_id), so this is a direct table query, no RPC needed.
export async function fetchMyRuns(limit = 100): Promise<RunHistoryEntry[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return fetchLocalRuns(limit);

  const { data, error } = await supabase
    .from('runs')
    .select('id, score, movement_score, duration, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    score: Number(row.score),
    movementScore: Number(row.movement_score),
    duration: row.duration,
    createdAt: row.created_at,
  }));
}

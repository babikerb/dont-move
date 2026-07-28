import { supabase } from './supabase';

export interface RunHistoryEntry {
  id: string;
  score: number;
  movementScore: number;
  duration: number;
  createdAt: string;
}

// public.runs RLS already scopes SELECT to the caller's own rows
// (auth.uid() = user_id), so this is a direct table query, no RPC needed.
export async function fetchMyRuns(limit = 100): Promise<RunHistoryEntry[]> {
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

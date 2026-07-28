import { supabase } from './supabase';

export interface RunToSync {
  score: number;
  movementScore: number;
  duration: number;
}

// Fire-and-forget: local storage.saveRun() is always the source of truth for
// gameplay, so a failed or offline submission here must never surface to the
// player or block Play Again. See CLAUDE.md: "gameplay is unaffected if
// signed out."
export async function submitRun(run: RunToSync): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;

    const { error } = await supabase.from('runs').insert({
      user_id: userId,
      score: run.score,
      movement_score: run.movementScore,
      duration: run.duration,
    });

    if (error) {
      console.warn('Run submission failed, local save is unaffected:', error.message);
    }
  } catch (err) {
    console.warn('Run submission failed, local save is unaffected:', err);
  }
}

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
//
// Guest runs never leave the device: only a real signed-in account gets
// synced. is_anonymous is checked defensively even though the app no longer
// creates anonymous accounts, in case one lingers from before this change.
export async function submitRun(run: RunToSync): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user || user.is_anonymous) return;

    const { error } = await supabase.from('runs').insert({
      user_id: user.id,
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

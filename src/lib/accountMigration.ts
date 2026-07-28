import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRunHistory } from './storage';
import { supabase } from './supabase';

const MIGRATED_KEY = '@dontmove/localHistoryMigrated';

// Anonymous-to-real sign-in (Apple/Google) upgrades the same auth user via
// identity linking, so it keeps the same auth.uid() - runs already synced by
// runSync.ts need no migration. This only backfills local run history that
// predates this device having a session to sync against at all (CLAUDE.md:
// "existing local data should seamlessly migrate ... without losing any
// scores or history"). Call once, right after a real sign-in completes.
export async function migrateLocalHistoryToAccount(): Promise<void> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATED_KEY);
  if (alreadyMigrated === 'true') return;

  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  const history = await getRunHistory();
  if (history.length > 0) {
    const rows = history.map((run) => ({
      user_id: userId,
      score: run.score,
      movement_score: run.movementScore,
      duration: 20,
      created_at: run.createdAt,
    }));

    const { error } = await supabase.from('runs').insert(rows);
    if (error) {
      console.warn('Local history migration failed, will retry next sign-in:', error.message);
      return;
    }
  }

  await AsyncStorage.setItem(MIGRATED_KEY, 'true');
}

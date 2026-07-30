import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_SCORE_KEY = '@pause/bestScore';
const RUN_HISTORY_KEY = '@pause/runHistory';
const TOO_STILL_LOG_KEY = '@pause/tooStillLog';
const MAX_HISTORY = 50;
const MAX_TOO_STILL_LOG = 50;

export interface StoredRun {
  score: number;
  movementScore: number;
  trace: number[];
  createdAt: string;
}

export interface SaveRunResult {
  isPersonalBest: boolean;
  bestScore: number;
}

export interface TooStillRejection {
  movementScore: number;
  createdAt: string;
}

export async function getBestScore(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(BEST_SCORE_KEY);
  return raw ? Number(raw) : null;
}

export async function getRunHistory(): Promise<StoredRun[]> {
  const raw = await AsyncStorage.getItem(RUN_HISTORY_KEY);
  return raw ? (JSON.parse(raw) as StoredRun[]) : [];
}

// Local storage only knows this device's history, so right after signing
// into an account that already has a better best score elsewhere (a fresh
// install, a different device), the two can disagree. Reconciles by taking
// the higher of the two and persisting it locally, so Home always reflects
// the account's real best once signed in.
export async function reconcileBestScore(remoteBest: number | null): Promise<number | null> {
  const localBest = await getBestScore();
  if (remoteBest === null) return localBest;
  if (localBest !== null && localBest >= remoteBest) return localBest;

  await AsyncStorage.setItem(BEST_SCORE_KEY, String(remoteBest));
  return remoteBest;
}

// remoteBest lets a signed-in run finish know about a better score already
// synced to the account (e.g. right after a reinstall, before Home's own
// separate reconciliation on mount has had a chance to run and write it to
// AsyncStorage) - without it, a fresh install's empty local storage would
// make any run look like a personal best even against an account with a
// much higher one already on file.
export async function saveRun(run: StoredRun, remoteBest: number | null = null): Promise<SaveRunResult> {
  const [localBest, history] = await Promise.all([getBestScore(), getRunHistory()]);
  const previousBest =
    remoteBest !== null && (localBest === null || remoteBest > localBest) ? remoteBest : localBest;
  const isPersonalBest = previousBest === null || run.score > previousBest;
  const bestScore = isPersonalBest ? run.score : previousBest;

  const nextHistory = [run, ...history].slice(0, MAX_HISTORY);

  await Promise.all([
    AsyncStorage.setItem(BEST_SCORE_KEY, String(bestScore)),
    AsyncStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(nextHistory)),
  ]);

  return { isPersonalBest, bestScore };
}

// A "too still to be handheld" cancel currently discards the run entirely -
// no record survives anywhere, local or remote, so a false positive is
// invisible. This keeps a small on-device-only log (never synced, never
// sent to analytics) of just the movementScore that tripped the floor, so
// MIN_LIVENESS_MOVEMENT can eventually be recalibrated against real
// rejected attempts instead of guesswork.
export async function logTooStillRejection(movementScore: number): Promise<void> {
  const existing = await getTooStillRejections();
  const next = [{ movementScore, createdAt: new Date().toISOString() }, ...existing].slice(
    0,
    MAX_TOO_STILL_LOG
  );
  await AsyncStorage.setItem(TOO_STILL_LOG_KEY, JSON.stringify(next));
}

export async function getTooStillRejections(): Promise<TooStillRejection[]> {
  const raw = await AsyncStorage.getItem(TOO_STILL_LOG_KEY);
  return raw ? (JSON.parse(raw) as TooStillRejection[]) : [];
}

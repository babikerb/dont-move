import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_SCORE_KEY = '@dontmove/bestScore';
const RUN_HISTORY_KEY = '@dontmove/runHistory';
const MAX_HISTORY = 50;

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

export async function saveRun(run: StoredRun): Promise<SaveRunResult> {
  const [previousBest, history] = await Promise.all([getBestScore(), getRunHistory()]);
  const isPersonalBest = previousBest === null || run.score > previousBest;
  const bestScore = isPersonalBest ? run.score : previousBest;

  const nextHistory = [run, ...history].slice(0, MAX_HISTORY);

  await Promise.all([
    AsyncStorage.setItem(BEST_SCORE_KEY, String(bestScore)),
    AsyncStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(nextHistory)),
  ]);

  return { isPersonalBest, bestScore };
}

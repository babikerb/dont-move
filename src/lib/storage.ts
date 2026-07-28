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

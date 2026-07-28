export interface ScoreResult {
  score: number;
  movementScore: number;
}

// Placeholder calibration, still needs tuning against real runs per PHASES.md
// Phase 1 ("Scoring algorithm v1 ... tuned iteratively"). RMS penalizes
// sustained jitter. Spikes above SPIKE_THRESHOLD are penalized on two fronts:
// how much excess movement there was on average across the whole run (so a
// single brief shake barely moves the average) and how big the single worst
// moment was (so real large movement still costs more than tiny corrections),
// per CLAUDE.md's Sensor Processing spec. Both terms are linear rather than
// squared, so a bad run grades down smoothly instead of cliff-diving to 0.
const RMS_PENALTY_SCALE = 5.5;
const SPIKE_THRESHOLD = 6;
const SPIKE_MEAN_PENALTY_SCALE = 12;
const SPIKE_PEAK_PENALTY_SCALE = 0.6;

// A real hand, no matter how steady, still produces physiological tremor
// that a rigid prop (table, laptop screen, wall) never will, regardless of
// the angle it's propped at. Orientation checks (see sensors.ts's flatness
// check) only catch specific angles; this catches any prop, at any angle,
// by looking for movement suspiciously below what a real hold can achieve.
// Calibrated against two genuine held runs that scored 93.80 and 94.76
// (movementScore ~1.13 and ~0.95), so this floor sits well below real
// performance but well above what an inert object should read. Still a
// placeholder pending more real-device data, especially from propped runs.
export const MIN_LIVENESS_MOVEMENT = 0.4;

export function isTooStillToBeHandheld(movementScore: number): boolean {
  return movementScore < MIN_LIVENESS_MOVEMENT;
}

export function computeScore(frames: number[]): ScoreResult {
  if (frames.length === 0) {
    return { score: 0, movementScore: 0 };
  }

  let sumSquares = 0;
  let excessSum = 0;
  let excessMax = 0;

  for (const m of frames) {
    sumSquares += m * m;
    const excess = Math.max(0, m - SPIKE_THRESHOLD);
    excessSum += excess;
    if (excess > excessMax) excessMax = excess;
  }

  const rms = Math.sqrt(sumSquares / frames.length);
  const meanExcess = excessSum / frames.length;
  const spikePenalty = meanExcess * SPIKE_MEAN_PENALTY_SCALE + excessMax * SPIKE_PEAK_PENALTY_SCALE;

  const rawScore = 100 - rms * RMS_PENALTY_SCALE - spikePenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score * 100) / 100,
    movementScore: Math.round(rms * 100) / 100,
  };
}

export interface ScoreResult {
  score: number;
  movementScore: number;
}

// Placeholder calibration, still needs tuning against real runs per PHASES.md
// Phase 1 ("Scoring algorithm v1 ... tuned iteratively"). RMS penalizes
// sustained jitter, and the squared term above SPIKE_THRESHOLD penalizes
// sudden movement far more than tiny corrections, per CLAUDE.md's Sensor
// Processing spec.
const RMS_PENALTY_SCALE = 5.5;
const SPIKE_THRESHOLD = 6;
const SPIKE_PENALTY_SCALE = 0.9;

export function computeScore(frames: number[]): ScoreResult {
  if (frames.length === 0) {
    return { score: 0, movementScore: 0 };
  }

  const meanSquare = frames.reduce((sum, m) => sum + m * m, 0) / frames.length;
  const rms = Math.sqrt(meanSquare);
  const peak = frames.reduce((max, m) => Math.max(max, m), 0);

  const spikeExcess = Math.max(0, peak - SPIKE_THRESHOLD);
  const spikePenalty = spikeExcess * spikeExcess * SPIKE_PENALTY_SCALE;

  const rawScore = 100 - rms * RMS_PENALTY_SCALE - spikePenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score: Math.round(score * 100) / 100,
    movementScore: Math.round(rms * 100) / 100,
  };
}

interface Anchor {
  score: number;
  top: number;
}

// Estimated distribution from CLAUDE.md's Percentiles section. The four
// interior anchors are the examples given there, and the two end anchors are
// extrapolated so the curve degrades gracefully outside the common range.
// Replace with live percentiles from real player data in Phase 5.
const ANCHORS: Anchor[] = [
  { score: 0, top: 99 },
  { score: 70, top: 99 },
  { score: 82, top: 90 },
  { score: 89.4, top: 47 },
  { score: 93.18, top: 24 },
  { score: 96.71, top: 8 },
  { score: 98.42, top: 2 },
  { score: 100, top: 0.1 },
];

export function estimatePercentileTop(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));

  for (let i = 0; i < ANCHORS.length - 1; i++) {
    const a = ANCHORS[i];
    const b = ANCHORS[i + 1];
    if (clamped >= a.score && clamped <= b.score) {
      const t = (clamped - a.score) / (b.score - a.score);
      return a.top + (b.top - a.top) * t;
    }
  }

  return ANCHORS[ANCHORS.length - 1].top;
}

export function formatTopPercent(topPercent: number): string {
  const rounded = topPercent < 1 ? Math.round(topPercent * 10) / 10 : Math.round(topPercent);
  return `Top ${rounded}%`;
}

export function formatPercentile(score: number): string {
  return formatTopPercent(estimatePercentileTop(score));
}

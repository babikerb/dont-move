// Dark, retro, tactical instrument palette (see CLAUDE.md's Design
// Language). Accent is a small functional set, not one hue reused
// everywhere - green for positive/active, amber for caution/secondary
// numbers, red for danger/rejection, teal for informational/secondary.
export const colors = {
  background: '#0A0A0A',
  surface: '#161616',
  border: '#2A2A2A',

  textPrimary: '#EDEAE4',
  textSecondary: '#9A9A94',
  textTertiary: '#5A5A56',

  accentGreen: '#7A9B6A',
  accentAmber: '#B8903F',
  // Lightened slightly from the original #B5493A - that version only hit
  // 3.75:1 contrast against the background, failing WCAG AA's 4.5:1
  // minimum for normal-sized text (it's used as body/caption-sized text in
  // several places: error messages, the Delete Account link). Same hue and
  // saturation, just enough lighter to clear 4.5:1.
  accentRed: '#C65C4D',
  accentTeal: '#5E8A8E',

  onAccent: '#0A0A0A',
  switchTrackOff: '#2A2A2A',
  switchThumb: '#EDEAE4',
} as const;

// Fixed scale per CLAUDE.md - no arbitrary spacing values.
export const spacing = {
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

// Mostly square. 2-8px maximum - nothing should feel soft.
export const radius = {
  sm: 2,
  md: 4,
  lg: 8,
} as const;

// Large jumps between heading and body, compact line heights.
export const type = {
  display: 72,
  title: 28,
  heading: 20,
  body: 16,
  label: 13,
  caption: 12,
} as const;

// JetBrains Mono, loaded in App.tsx - reserved for timers, counters,
// scores, coordinates, timestamps. Never for prose.
export const fontFamily = {
  mono: 'JetBrainsMono_400Regular',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
} as const;

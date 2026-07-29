import Aptabase, { trackEvent } from '@aptabase/react-native';

// Aptabase over Sentry/PostHog: free tier, privacy-first (no ad IDs, no
// cross-app tracking), and a per-app dashboard the developer can log into
// directly - see PHASES.md Phase 8. Deliberately lightweight: only the
// funnel CLAUDE.md's Success Metrics actually cares about (launch, play,
// result, share or replay), not general-purpose event tracking.
const APP_KEY = 'A-US-7325781948';

// Every call here is wrapped defensively - analytics is the last thing that
// should ever be able to crash the app. init() in particular runs
// synchronously inside App.tsx's mount-time useEffect with no error
// boundary above it; if the native module isn't linked for any reason
// (e.g. a build that predates this dependency being added), an uncaught
// throw there would take down the entire app at launch, not just silently
// skip tracking.
function safely(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    console.warn('Analytics call failed (ignored):', err);
  }
}

export function initAnalytics(): void {
  safely(() => Aptabase.init(APP_KEY));
}

export function trackAppLaunched(): void {
  safely(() => trackEvent('app_launched'));
}

export function trackPlayStarted(): void {
  safely(() => trackEvent('play_started'));
}

export function trackRunCompleted(score: number, isPersonalBest: boolean): void {
  safely(() => trackEvent('run_completed', { score, isPersonalBest }));
}

export function trackPlayAgain(): void {
  safely(() => trackEvent('play_again'));
}

export function trackShared(): void {
  safely(() => trackEvent('shared'));
}

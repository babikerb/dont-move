import Aptabase, { trackEvent } from '@aptabase/react-native';

// Aptabase over Sentry/PostHog: free tier, privacy-first (no ad IDs, no
// cross-app tracking), and a per-app dashboard the developer can log into
// directly - see PHASES.md Phase 8. Deliberately lightweight: only the
// funnel CLAUDE.md's Success Metrics actually cares about (launch, play,
// result, share or replay), not general-purpose event tracking.
const APP_KEY = 'A-US-7325781948';

export function initAnalytics(): void {
  Aptabase.init(APP_KEY);
}

export function trackAppLaunched(): void {
  trackEvent('app_launched');
}

export function trackPlayStarted(): void {
  trackEvent('play_started');
}

export function trackRunCompleted(score: number, isPersonalBest: boolean): void {
  trackEvent('run_completed', { score, isPersonalBest });
}

export function trackPlayAgain(): void {
  trackEvent('play_again');
}

export function trackShared(): void {
  trackEvent('shared');
}

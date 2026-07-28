# Don't Move — Build Phases

No code is written as part of this document. Each phase should ship something that runs, before moving to the next.

---

## Phase 0 — Project Setup (done)

- Expo + TypeScript scaffold
- Dependencies installed: React Navigation, TanStack Query, Expo Sensors/Haptics/AV, react-native-svg, Supabase JS
- `app.json` configured (dark mode default, bundle IDs, portrait lock)
- CLAUDE.md finalized, including the Human Seismograph visual theme
- Git repo initialized and pushed (private)

---

## Phase 1 — Core Loop, Fully Local

Goal: the entire 30-second game loop works, offline, with zero backend.

- Navigation shell: Home → Countdown → Run → Results (React Navigation stack)
- Home screen: logo, local Best Score, Play button, disabled/stub Leaderboard + Settings entries
- 3-2-1 countdown with haptic-per-second + GO audio cue
- 20-second run screen: large timer, live seismograph trace (Expo Sensors → smoothing → react-native-svg line)
- Sensor pipeline: accelerometer + gyroscope sampling, noise smoothing/filtering, combined movement signal
- Scoring algorithm v1: produces the 0.00–100.00 curve described in CLAUDE.md (most players 82–94, tuned iteratively)
- Results screen: large score, condensed static trace, estimated percentile (static distribution table), Personal Best detection, Play Again / Share(stub) / Home
- Local persistence: best score + run history (AsyncStorage or SQLite)
- Personal Best moment: stronger haptic + celebratory animation

Exit criteria: a first-time user can install, play, and see a believable score with zero network calls.

---

## Phase 2 — Polish Pass

Goal: make Phase 1 feel like the finished product, not a prototype.

- Full sound pass (countdown ticks, GO, PB celebration, button clicks) — no background music
- Full haptics pass per CLAUDE.md's Haptics section
- Animation/transition pass: spring-based screen transitions, score reveal, trace draw-in
- Typography, spacing, color pass against the Design Language section
- Settings screen: Sound, Haptics, Privacy, Sign In (stub), About
- Accessibility pass (dynamic type, reduced motion, VoiceOver labels)

Exit criteria: launch → first run → result feels "Apple fitness app," not "arcade game."

---

## Phase 3 — Share Card

Goal: every run produces something worth posting, still fully offline.

- Share card renderer: dark background, score, percentile, seismograph trace, "Can you beat me?", QR code pointing to a (placeholder) app link
- Native share sheet integration
- Verify legibility/crop on Instagram Stories, TikTok, Discord, X aspect ratios

Exit criteria: a generated share image is indistinguishable in polish from a hand-designed asset.

---

## Phase 4 — Backend Foundation (Supabase)

Goal: introduce accounts and sync without touching the local-first golden path.

- Supabase project: Postgres schema for User, Run, Daily Challenge (per CLAUDE.md Data Model)
- Anonymous auth wired in at app launch (invisible to the user)
- Apple + Google sign-in, triggered only when a gated feature is tapped
- Local → account data migration on first sign-in (no data loss)
- Run submission to Supabase on completion (in addition to local save)

Exit criteria: signing in mid-session migrates all local history with nothing lost, and gameplay is unaffected if signed out.

---

## Phase 5 — Leaderboards & Real Percentiles

Goal: turn scores into social competition.

- Leaderboard screen: Global / Country / Friends / Today / This Week / All Time tabs
- Only highest score per user counts
- Replace estimated percentiles with live percentiles computed from real Supabase data
- Friend challenge flow (send/accept, compare scores)
- Supabase Realtime for live leaderboard movement where it adds value (e.g., "someone just beat you")

Exit criteria: percentiles and ranks reflect real global data, not the static table.

---

## Phase 6 — Daily Challenge & Retention

Goal: give players a reason to come back daily without violating "no gimmicks."

- Daily challenge generator (rotates duration/sensitivity/tolerance per CLAUDE.md)
- Separate daily leaderboard + streak tracking
- Sparse, meaningful notifications only: friend beat your score, new daily challenge, lost leaderboard position
- Notification permission requested contextually, never at first launch

Exit criteria: daily challenge and notifications increase day-2 retention without adding friction to the core loop.

---

## Phase 7 — Store Readiness & Launch

Goal: ship it.

- App icons, splash, store screenshots/metadata (ASO pass)
- Crash reporting / lightweight analytics (funnel: launch → play → result → share/replay)
- Privacy policy + account deletion flow (App Store/Play requirement given accounts + leaderboards)
- TestFlight / internal testing round
- Submit to App Store and Play Store

Exit criteria: success metrics from CLAUDE.md are measurable in production (time-to-play, replay rate, share rate).

---

## Deliberately Deferred (per CLAUDE.md's Future Features)

Replay visualization, verified competition mode, seasonal rankings, teams, tournament brackets, creator leaderboards, Apple Watch companion — all build on the Phase 1 seismograph trace and Phase 4/5 backend, revisited only after Phase 7 ships.

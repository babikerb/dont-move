# Don't Move: Build Phases

No code is written as part of this document. Each phase should ship something that runs, before moving to the next.

---

## Phase 0: Project Setup (done)

- Expo and TypeScript scaffold
- Dependencies installed: React Navigation, TanStack Query, Expo Sensors, Expo Haptics, Expo Audio, react-native-svg, Supabase JS
- `app.json` configured (dark mode default, bundle IDs, portrait lock)
- CLAUDE.md finalized, including the Human Seismograph visual theme
- Git repo initialized and pushed (private)

---

## Phase 1: Core Loop, Fully Local (done)

Goal: the entire 30-second game loop works, offline, with zero backend.

- Navigation shell: Home, then Play (countdown and run combined into one screen, see below), then Results (React Navigation stack)
- Home screen: logo, local Best Score, Play button, stub Leaderboard entry, real Settings entry
- Three layered anti-propping measures, described in CLAUDE.md's Starting a Run and Fairness sections: press-and-hold to start (the player must keep a finger on the screen through the countdown and the entire run, or it cancels, closing the "set it down and walk away" case), a phone-orientation check that rejects a run if the phone reads as lying flat rather than held up to look at (closing the "flat on a table while still touching the screen" case), and a movement floor that rejects a run whose overall movement is suspiciously below what a real hand's physiological tremor can achieve, regardless of the phone's angle (closing propping at any angle, such as leaned against another object)
- 3-2-1 countdown with a haptic each second and a GO audio cue
- 20-second run phase: large timer, live seismograph trace (Expo Sensors, smoothed, drawn with react-native-svg, fixed pixel spacing so it scrolls like a strip chart from the first sample)
- Sensor pipeline: accelerometer and gyroscope sampling, gravity removal (snapped to the first reading to avoid a cold-start false spike), noise smoothing and filtering, combined movement signal
- Scoring algorithm v1: produces the 0.00 to 100.00 curve described in CLAUDE.md (most players 82 to 94, tuned iteratively), with a linear rather than squared spike penalty so a bad run grades down smoothly instead of clamping straight to 0
- Results screen: large score, condensed static trace, estimated percentile (static distribution table), a rotating flavor-text message for non-personal-best runs, Personal Best detection, Play Again, Share (stub), and Home
- Local persistence: best score and run history (AsyncStorage)
- Personal Best moment: stronger haptic and celebratory animation

Exit criteria: a first-time user can install, play, and see a believable score with zero network calls.

---

## Phase 2: Polish Pass (done)

Goal: make Phase 1 feel like the finished product, not a prototype.

- Full sound pass (countdown ticks, GO, PB celebration, button clicks), no background music, all gated by the Settings sound toggle
- Full haptics pass per CLAUDE.md's Haptics section, gated by the Settings haptics toggle
- Animation and transition pass: spring-based screen transitions (skipped in favor of an instant cut when reduce motion is on), a fade-and-scale score reveal on every run, and a stroke draw-in animation for the results trace
- Typography, spacing, color pass against the Design Language section, including moving stray hardcoded colors into the shared theme
- Settings screen: Sound and Haptics toggles (persisted), Privacy (stub), Sign In (stub), About
- Accessibility pass: accessibilityLabel and accessibilityRole on interactive elements, reduce-motion support for navigation transitions and the results/trace animations

Exit criteria: launch, first run, and result feel like an Apple fitness app, not an arcade game.

---

## Phase 3: Share Card (done)

Goal: every run produces something worth posting, still fully offline.

- Share card renderer (a 360x640 off-screen view, captured to a PNG): mirrors the Results screen rather than a separate design, score, percentile, seismograph trace, PERSONAL BEST when applicable, "Can you beat me?". No logo or QR code, kept minimal on purpose
- Native share sheet integration via react-native-view-shot (bundled in Expo Go, no dev client needed) and expo-sharing
- Legibility and crop against Instagram Stories, TikTok, Discord, and X aspect ratios is still to be checked on a real device across those apps

Exit criteria: a generated share image is indistinguishable in polish from a hand-designed asset.

---

## Phase 4: Backend Foundation (Supabase)

Goal: introduce accounts and sync without touching the local-first golden path.

- Supabase project: Postgres schema for User, Run, Daily Challenge (per CLAUDE.md Data Model)
- Anonymous auth wired in at app launch (invisible to the user)
- Apple and Google sign-in, triggered only when a gated feature is tapped
- Local to account data migration on first sign-in (no data loss)
- Run submission to Supabase on completion (in addition to local save)

Exit criteria: signing in mid-session migrates all local history with nothing lost, and gameplay is unaffected if signed out.

---

## Phase 5: Leaderboards and Real Percentiles

Goal: turn scores into social competition.

- Leaderboard screen: Global, Country, Friends, Today, This Week, and All Time tabs
- Only highest score per user counts
- Replace estimated percentiles with live percentiles computed from real Supabase data
- Friend challenge flow (send, accept, compare scores)
- Supabase Realtime for live leaderboard movement where it adds value (for example, "someone just beat you")

Exit criteria: percentiles and ranks reflect real global data, not the static table.

---

## Phase 6: Account Management and Compliance

Goal: real accounts now exist (Phase 4 shipped Apple Sign In), so App Store/Play Store account requirements are live, not a someday problem.

- Account deletion (done): a "Delete Account" action on the Account screen, initiated entirely in-app (Apple App Store Review Guideline 5.1.1(v) - a support email or web link alone doesn't satisfy this)
- A Supabase Edge Function (`delete-account`) using the service_role key handles the actual deletion via `auth.admin.deleteUser()` - the client's publishable key can never delete an `auth.users` row directly. The function always deletes the caller's own id, derived server-side from their verified JWT, never a client-supplied id. `public.users` and `public.runs` cascade-delete automatically via their existing foreign keys (verified against a disposable test account), so no separate cleanup is needed
- Strongly worded, unambiguous confirmation before deleting (irreversible: loses synced history, avatar, stats, leaderboard position)
- Local device data (AsyncStorage best score/history) is untouched by account deletion, same as sign-out - only the account and its synced Supabase data are removed
- Blocking/reporting: deferred. The app currently has no user-to-user interaction (the leaderboard is read-only viewing), so Apple's user-generated-content guideline (1.2) requiring a block mechanism doesn't apply yet. Build it alongside Phase 5's still-unbuilt Friend Challenges, which is the first place blocking becomes meaningful (blocking someone from sending a friend request)

Exit criteria: a signed-in user can fully delete their account and all associated data from within the app, with nothing left behind.

---

## Phase 7: Daily Challenge and Retention

Goal: give players a reason to come back daily without violating "no gimmicks."

- Daily challenge generator (rotates duration, sensitivity, and tolerance per CLAUDE.md)
- Separate daily leaderboard and streak tracking
- Sparse, meaningful notifications only: friend beat your score, new daily challenge, lost leaderboard position
- Notification permission requested contextually, never at first launch

Exit criteria: daily challenge and notifications increase day-two retention without adding friction to the core loop.

---

## Phase 8: Store Readiness and Launch

Goal: ship it.

- App icons, splash, store screenshots and metadata (ASO pass)
- Crash reporting and lightweight analytics (funnel: launch, play, result, share or replay)
- Privacy policy (account deletion itself is covered by Phase 6, not repeated here)
- TestFlight and internal testing round
- Submit to App Store and Play Store

Exit criteria: success metrics from CLAUDE.md are measurable in production (time to play, replay rate, share rate).

---

## Deliberately Deferred (per CLAUDE.md's Future Features)

Replay visualization, verified competition mode, seasonal rankings, teams, tournament brackets, creator leaderboards, and an Apple Watch companion. All of these build on the Phase 1 seismograph trace and the Phase 4/5 backend, and are revisited only after Phase 8 ships.

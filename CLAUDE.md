# CLAUDE.md

# Don't Move

Don't Move is a mobile game where players compete to hold their phone as still as possible.

The concept should be understandable in under five seconds.

> "Don't move."

That's the entire game.

The product should feel more like an Apple-designed fitness app than an arcade game. Clean, minimal, and satisfying.

---

# Vision

Don't Move is designed to become a social challenge app.

Every session should naturally lead to one of three actions:

- Play again
- Beat a friend
- Share your score

The game itself should take less than 30 seconds.

Everything else is secondary.

---

# Visual Theme: The Human Seismograph

Don't Move has one visual signature that appears everywhere movement is shown: a live trace line, styled after a seismograph / EKG monitor.

- **During the run**, the "minimal movement indicator" required in the Gameplay spec IS this trace: a thin animated line drawn in the accent green, scrolling left to right. Perfect stillness renders as a flat line. Any movement produces a spike proportional to its severity.
- **Perfect stillness looks like a flatline.** This is intentional. It borrows the emotional weight of a medical monitor (calm, clinical, slightly tense) and reframes "I didn't move" as "I flatlined," which is both a legitimate flex and a joke worth sharing.
- **On the Results screen**, a condensed, static version of the player's trace can appear as a secondary element beneath the score (never competing with it for visual weight).
- **On the Share Card**, the trace is the second-most prominent element after the score itself. It's what makes the card recognizable as *this specific run* rather than a generic score screenshot, and what makes it recognizable as *Don't Move* at a glance even with no logo visible.
- This motif is the natural foundation for the future "Movement graph" and "Replay visualization" features. Those are a zoomed-in, scrubbable version of the same trace, not a new concept.

Rendering notes:
- Single stroke, accent green (`#7A9B6A`), subtle phosphor-style glow (like a CRT oscilloscope trace, not a neon effect), no fill.
- No axis labels, gridlines, or units. This is a feeling, not a chart.
- Motion should be smooth (interpolated and eased), never jittery from raw sensor noise. The trace shows the *scored* movement signal, after smoothing, not raw accelerometer output.

---

# Product Principles

## Simplicity

There should never be more than one primary action on screen.

No tutorials.

No onboarding.

No unnecessary settings.

A first-time user should immediately understand what to do.

---

## Polish

Animations, haptics, typography, spacing, and sound matter more than adding features.

Every transition should feel intentional.

The app should feel premium despite having a single mechanic.

---

## Fairness

Scores should feel believable.

Sensor noise should never dramatically affect results.

The scoring algorithm should reward consistency rather than luck.

A run only counts if the player is actively holding the phone. See **Starting a Run**: the press-and-hold requirement exists so the game can't be trivially beaten by propping the phone on a still surface. Holding a finger on the screen while the phone itself rests flat on a table still bypasses the hold requirement, so a second check watches the phone's orientation: gravity read almost entirely on the screen-perpendicular axis means it is lying flat, not being held up to look at, and the run is rejected. This does not catch every propping method (a phone leaned upright against something still passes), only the flat-on-a-surface case.

---

## Shareability

Every play session should create content worth sharing.

The share image should look good enough that users want to post it without editing.

---

# First Run Experience

Don't Move should have zero friction.

A new user should be able to install the app and begin their first run immediately without creating an account.

By default:

- All scores are stored locally on the device.
- Personal Best is tracked locally.
- Basic statistics are available immediately.
- No login prompts should appear during gameplay.

Users should only be prompted to create an account when they attempt to use features that require one, such as:

- Appearing on global leaderboards
- Challenging friends
- Syncing progress across devices
- Participating in online competitions
- Restoring progress after reinstalling the app

Authentication should feel like an upgrade, not a requirement.

If a user chooses to create an account, their existing local data should seamlessly migrate to their new account without losing any scores or history.

---

# Gameplay

## Home

Display:

- Logo
- Best Score
- Play button
- Leaderboard
- Settings

Nothing else.

The Play button should always be the visual focus.

---

## Starting a Run

Press **Play**.

Press and hold the screen to begin. Keep holding through the countdown and the entire run. Letting go at any point cancels the run.

This is the anti-propping measure: setting the phone down on a table or stand releases the touch, so a truly still run can only come from someone actively holding it. Without this, resting the phone on a flat surface would trivially produce a perfect score, which defeats the whole point of the game.

Holding a finger on the screen while the phone itself rests flat on a table still bypasses this, so the app also rejects a run if the phone's orientation reads as lying flat rather than held up to look at. See **Fairness**.

3-second countdown.

Short haptic each second.

Audio cue on **GO**.

Begin recording sensor data.

---

## During the Run

Duration:

20 seconds

Display:

- Large countdown timer
- Minimal movement indicator, rendered as the live seismograph trace (see **Visual Theme: The Human Seismograph** above)

Do **not** show the score while the run is active.

The player should focus entirely on remaining still.

---

## Sensor Processing

Use:

- Accelerometer
- Gyroscope

Sample at the highest stable frequency Expo supports.

Raw sensor values should never be used directly.

Apply smoothing.

Ignore tiny fluctuations caused by hardware noise.

Movement score should combine rotational and linear movement.

Large sudden movements should have a significantly larger penalty than tiny corrections.

The smoothed, post-processing movement signal is also what drives the seismograph trace. The trace and the score must always tell the same story.

---

# Scoring

Final score:

0.00–100.00

Scores should follow a curve where:

Most players score between:

82–94

Good players:

94–97

Excellent players:

97–99

100 should essentially never happen.

The algorithm should be calibrated until scores feel fair.

Do not expose scoring internals.

---

# Results Screen

Display:

- Large score
- Percentile
- A condensed static rendering of the player's seismograph trace (secondary to the score)
- Optional leaderboard placement
- Personal Best indicator

Buttons:

- Play Again
- Share
- Home

Example:

```
98.42

Top 2%

_____/\____________   (your trace)

Personal Best
```

If the user achieved a personal best:

- Stronger haptics
- More celebratory animation
- Save the run immediately

The score should always be the visual focus.

---

# Percentiles

Initially:

Use estimated percentiles based on an expected score distribution.

Examples:

- 98.42 → Top 2%
- 96.71 → Top 8%
- 93.18 → Top 24%
- 89.40 → Top 47%

Later:

Replace estimated percentiles with live global percentiles based on real player data.

Percentiles should always encourage another run.

---

# Share Card

Generate automatically after every run.

Layout deliberately mirrors the Results screen rather than being a separate design, so it feels like a direct extension of what the player just saw, not a different artifact:

```
DON'T MOVE

98.42

TOP 2%

_____/\____________   (your trace)

Can you beat me?
```

The wordmark is small and quiet, not a dominant logo lockup. No QR code. The trace line is the second-most prominent element after the score. Flat sections read as "flatlined," a spike reads as the moment they slipped. It's what makes the card recognizable as a Don't Move result even at a glance.

Optional additions:

- PERSONAL BEST
- #42 GLOBAL
- #3 TODAY
- #18 UNITED STATES

The design should remain extremely minimal.

Dark background.

Large typography.

Minimal branding.

Square canvas (1080x1080 at typical capture scale), not a 9:16 story shape - chat apps show shared images center-cropped toward square in their inline preview (iMessage, WhatsApp, X timeline), so all critical content stays inside a centered ~800x800 safe area (~140px padding per edge) rather than risking the top/bottom being cropped off before anyone taps to view it full size.

Optimized for:

- iMessage
- WhatsApp
- Instagram Stories
- TikTok
- Discord
- X

The image should be instantly recognizable at a glance.

---

# Leaderboards

Tabs:

- Global
- Country
- Friends
- Today
- This Week
- All Time

Each entry displays:

- Rank
- Username
- Score
- Country
- Timestamp

Only the user's highest score counts.

---

# Daily Challenge

Every day, all players receive the same challenge.

Examples:

- Longer duration
- Higher sensitivity
- Lower movement tolerance

Everyone competes under identical rules.

Separate leaderboard.

Daily streak.

---

# Accounts

Anonymous account by default.

Optional sign in:

- Apple
- Google

Guest progress should migrate seamlessly after login.

---

# Notifications

Used sparingly.

Examples:

- A friend beat your score.
- New daily challenge.
- You lost your leaderboard position.

Never spam users.

---

# Settings

- Sound
- Haptics
- Privacy
- Sign In / Account
- About

Nothing else.

---

# Tech Stack

## Frontend

- React Native
- Expo
- TypeScript
- React Navigation
- TanStack Query
- Expo Sensors
- Expo Haptics
- Expo AV

## Backend

- Supabase

## Database

- PostgreSQL

## Authentication

- Anonymous
- Apple
- Google

## Storage

- Supabase Storage

## Realtime

- Supabase Realtime

---

# Data Model

## User

- id
- username
- country
- created_at

## Run

- id
- user_id
- score
- duration
- movement_score
- created_at

## Daily Challenge

- id
- date
- rules
- leaderboard

---

# Design Language

Dark, retro, tactical, minimal. High information density. Fast. Confident. Purpose-built.

Think old monochrome terminals, Braun industrial design, early iPod UI, retro Casio watches, vintage digital clocks, oscilloscopes, dark aviation instruments. Timeless, not futuristic. Not cyberpunk, not synthwave, not gamer, no neon overload.

The app should feel like a precision instrument, not an arcade game. Everything exists for a reason — if an element doesn't improve usability, remove it. Typography, spacing, alignment, rhythm, and contrast do the work; visual effects don't.

## Color

- Background: near black (`#0A0A0A`)
- Surface: slightly lighter charcoal (`#161616`)
- Border: low-contrast gray (`#2A2A2A`), hairline, flat — never a shadow
- Primary text: warm white (`#EDEAE4`)
- Secondary text: muted gray (`#9A9A94`)

Accent is a small tactical-instrument palette, not one hue reused everywhere — the way a real instrument panel uses distinct functional colors (go, caution, stop) rather than a single decorative one. Each accent is muted and desaturated, never neon:

- Green `#7A9B6A` — positive/active/primary: score, primary actions, personal best, "go"
- Amber `#B8903F` — caution/secondary emphasis: ranks, secondary stats, in-progress states
- Red `#B5493A` — danger/rejection: cancelled runs, errors, "stop"
- Teal `#5E8A8E` — informational/secondary highlight: metadata, timestamps, non-primary tabs

No rainbow colors, no purple, no bright blue, no bright gradients, no neon. Never rely on color alone to establish hierarchy — pair every accent use with typography/position, not color alone.

The seismograph trace (see **Visual Theme**) is the app's core recurring visual motif, always rendered in the accent green. It should appear during the run, on the results screen, and on the share card, always rendered the same way.

## Spacing

Fixed scale: 4, 8, 12, 16, 20, 24, 32. No arbitrary values. Tight, predictable vertical rhythm — this is professional instrument software adapted for mobile, not a spacious marketing site.

## Corners

Mostly square. 2–8px radius maximum. Nothing should feel soft.

## Typography

The primary design element. Large jumps between heading and body sizes, consistent weights, compact line heights, uppercase labels used sparingly. Monospace (JetBrains Mono) only for timers, counters, scores, coordinates, timestamps, and other values that benefit from a technical feel — never for prose.

## Motion

Fast and purposeful, under 250ms. No spring overshoot, no bounce. Motion communicates navigation, state changes, loading, or confirmation — never decoration.

## Components

Custom-built, not stock-looking. Borders over shadows. No blur, no glassmorphism, no glowing borders, no gradients, no floating translucent cards, no giant pill buttons, no decorative icons or dividers. Prefer sections separated by spacing and hairline borders over cards; if a card is used, it's flat, square-ish, thin-bordered, no shadow.

The bottom tab bar and every screen header are fully custom (never the default React Navigation appearance): solid background, thin border, edge-to-edge, no blur, no floating pill. The tab bar should feel like hardware — buttons on a vintage electronic device.

---

# Audio

Minimal.

- Countdown ticks
- GO sound
- Personal Best celebration
- Soft button clicks

No background music.

---

# Haptics

- Countdown
- GO
- Personal Best
- Leaderboard improvements

Haptics should reinforce meaningful moments only.

---

# Future Features

- Friend challenges
- Replay visualization (scrubbable, zoomed-in version of the seismograph trace)
- Movement graph (full-run detail view built on the same trace data)
- Verified competition mode
- Seasonal rankings
- Teams
- Tournament brackets
- Creator leaderboards
- Apple Watch companion

---

# Things We Will Not Build

- Achievements
- XP
- Levels
- Loot boxes
- Coins
- Energy systems
- Ads between runs
- Review popups after every game

Anything that interrupts the core gameplay loop.

---

# Success Metrics

A new player understands the game within five seconds.

Time from app launch to gameplay is under ten seconds.

A complete run takes less than thirty seconds.

At least 30% of players immediately start another run.

The share card is attractive enough that users voluntarily post it.

Every design decision should answer one question:

> Does this make Don't Move more fun, more understandable, or more shareable?

If the answer is no, don't build it.

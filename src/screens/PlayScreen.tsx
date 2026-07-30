import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { TRACE_LENGTH, useMovementSession } from '../lib/sensors';
import { computeScore, isTooStillToBeHandheld } from '../lib/scoring';
import { logTooStillRejection, saveRun } from '../lib/storage';
import { submitRun } from '../lib/runSync';
import { fetchMyStats } from '../lib/stats';
import { scheduleComeBackReminder } from '../lib/notifications';
import { trackPlayStarted, trackRunCompleted } from '../lib/analytics';
import { SeismographTrace } from '../components/SeismographTrace';
import { hapticCountdownTick, hapticGo, hapticReleasedEarly } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { playSound } from '../lib/sound';
import { colors, fontFamily, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>;

const COUNT_START = 3;
const RUN_DURATION_SECONDS = 20;
const STORED_TRACE_LENGTH = 60;

type Phase = 'idle' | 'countdown' | 'running';
type CancelReason = 'released' | 'flat' | 'tooStill' | null;

function downsample(values: number[], targetLength: number): number[] {
  if (values.length <= targetLength) return values;
  const step = values.length / targetLength;
  const result: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    result.push(values[Math.floor(i * step)]);
  }
  return result;
}

// Three layered anti-propping measures. First, the player must keep a finger
// on the screen from the start of the countdown through the end of the run,
// since letting go to set the phone down cancels it immediately. Second,
// sensors.ts flags when the phone is lying flat (gravity almost entirely on
// the screen-perpendicular axis), since that's true regardless of whether a
// finger is still touching the glass. Third, scoring.ts rejects a run whose
// overall movement is suspiciously below what a real hand's physiological
// tremor can achieve, which catches propping at any angle, not just flat
// surfaces. The hold gesture itself still doesn't have a clean screen-reader
// equivalent, a known gap for later.
export function PlayScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const { trace, start, stop, getFrames, isFlat } = useMovementSession();
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(COUNT_START);
  const [secondsLeft, setSecondsLeft] = useState(RUN_DURATION_SECONDS);
  const [cancelReason, setCancelReason] = useState<CancelReason>(null);

  const heldRef = useRef(false);
  const finishedRef = useRef(false);
  // Fetched in the background over the run's 20 seconds rather than at the
  // moment it finishes, so verifying the account's real best score against
  // Supabase doesn't add a visible delay right when the player is waiting
  // to see their result. See saveRun's remoteBest param in storage.ts.
  const remoteBestRef = useRef<Promise<number | null>>(Promise.resolve(null));

  const resetToIdle = useCallback(() => {
    heldRef.current = false;
    finishedRef.current = false;
    setPhase('idle');
    setCount(COUNT_START);
    setSecondsLeft(RUN_DURATION_SECONDS);
  }, []);

  const cancelRun = useCallback(
    (reason: 'released' | 'flat' | 'tooStill') => {
      stop();
      resetToIdle();
      setCancelReason(reason);
      hapticReleasedEarly();
    },
    [stop, resetToIdle]
  );

  useEffect(() => {
    if (phase !== 'countdown') return;

    if (count > 0) {
      hapticCountdownTick();
      playSound('tick');
      const timer = setTimeout(() => {
        if (!heldRef.current) return;
        setCount((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    hapticGo();
    playSound('go');
    const timer = setTimeout(() => {
      if (!heldRef.current) return;
      setPhase('running');
    }, 350);
    return () => clearTimeout(timer);
  }, [phase, count]);

  useEffect(() => {
    if (phase !== 'running') return;

    start();
    remoteBestRef.current = fetchMyStats().then((stats) => stats?.bestScore ?? null);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      if (finishedRef.current) return;

      if (isFlat()) {
        finishedRef.current = true;
        heldRef.current = false;
        clearInterval(interval);
        stop();
        cancelRun('flat');
        return;
      }

      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, RUN_DURATION_SECONDS - elapsedSeconds);
      setSecondsLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        finishedRef.current = true;
        clearInterval(interval);
        stop();
        finishRun();
      }
    }, 100);

    return () => clearInterval(interval);
    // Sensor start/stop and the timer should only fire once per entry into
    // the running phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const finishRun = async () => {
    const frames = getFrames();
    const { score, movementScore } = computeScore(frames);

    if (isTooStillToBeHandheld(movementScore)) {
      logTooStillRejection(movementScore);
      cancelRun('tooStill');
      return;
    }

    const traceSnapshot = downsample(frames, STORED_TRACE_LENGTH);
    const remoteBest = await remoteBestRef.current;

    const { isPersonalBest, bestScore } = await saveRun(
      {
        score,
        movementScore,
        trace: traceSnapshot,
        createdAt: new Date().toISOString(),
      },
      remoteBest
    );

    submitRun({ score, movementScore, duration: RUN_DURATION_SECONDS }).then(() => {
      // Leaderboard already updates itself via the Realtime broadcast
      // trigger; these two aren't covered by that, so without this they'd
      // show last run's numbers for up to a minute (the cache's staleTime).
      queryClient.invalidateQueries({ queryKey: ['myStats'] });
      queryClient.invalidateQueries({ queryKey: ['myRuns'] });
    });

    // Pushes the "come back" local reminder another 24h out from now,
    // rather than leaving whatever was scheduled at launch/last run.
    scheduleComeBackReminder();
    trackRunCompleted(score, isPersonalBest);

    navigation.replace('Results', {
      score,
      movementScore,
      trace: traceSnapshot,
      isPersonalBest,
      bestScore,
    });
  };

  const handlePressIn = () => {
    if (phase !== 'idle') return;
    heldRef.current = true;
    setCancelReason(null);
    setPhase('countdown');
    trackPlayStarted();
  };

  const handlePressOut = () => {
    if (finishedRef.current) return;
    if (!heldRef.current) return;
    heldRef.current = false;
    cancelRun('released');
  };

  const handleGoHome = () => {
    tapFeedback();
    navigation.goBack();
  };

  return (
    <Pressable
      style={styles.container}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={phase === 'idle' ? 'Press and hold to begin' : 'Hold still'}
      accessibilityHint="Keep holding until the run ends. Letting go cancels it."
    >
      {phase === 'idle' && (
        <Pressable
          style={({ pressed }) => [
            styles.homeButton,
            { top: insets.top + spacing.md },
            pressed && styles.homeButtonPressed,
          ]}
          onPress={handleGoHome}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </Pressable>
      )}

      {phase === 'idle' && (
        <View style={styles.center}>
          <Text style={styles.prompt}>Press and hold to begin</Text>
          {cancelReason === 'released' && (
            <Text style={styles.releasedText}>Let go too soon. Try again.</Text>
          )}
          {cancelReason === 'flat' && (
            <Text style={styles.releasedText}>Hold the phone up. Don't rest it on a surface.</Text>
          )}
          {cancelReason === 'tooStill' && (
            <Text style={styles.releasedText}>That was too still to be handheld. Try again.</Text>
          )}
        </View>
      )}

      {phase === 'countdown' && <Text style={styles.countText}>{count > 0 ? count : 'GO'}</Text>}

      {phase === 'running' && (
        <View style={styles.runningContainer}>
          <Text style={styles.timer}>{secondsLeft}</Text>
          <View style={styles.traceWrapper}>
            <SeismographTrace values={trace} width={width} height={120} capacity={TRACE_LENGTH} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButton: {
    position: 'absolute',
    left: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minHeight: 44,
    justifyContent: 'center',
  },
  homeButtonPressed: {
    opacity: 0.7,
  },
  homeButtonText: {
    color: colors.textPrimary,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  center: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  prompt: {
    color: colors.textPrimary,
    fontSize: type.heading,
    fontWeight: '600',
    textAlign: 'center',
  },
  releasedText: {
    color: colors.accentRed,
    fontSize: type.body,
    fontWeight: '500',
    textAlign: 'center',
  },
  countText: {
    color: colors.accentGreen,
    fontFamily: fontFamily.monoBold,
    fontSize: 88,
  },
  runningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  timer: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoBold,
    fontSize: 110,
  },
  traceWrapper: {
    width: '100%',
  },
});

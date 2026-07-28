import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { TRACE_LENGTH, useMovementSession } from '../lib/sensors';
import { computeScore } from '../lib/scoring';
import { saveRun } from '../lib/storage';
import { SeismographTrace } from '../components/SeismographTrace';
import { hapticCountdownTick, hapticGo, hapticReleasedEarly } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Play'>;

const COUNT_START = 3;
const RUN_DURATION_SECONDS = 20;
const STORED_TRACE_LENGTH = 60;

type Phase = 'idle' | 'countdown' | 'running';

function downsample(values: number[], targetLength: number): number[] {
  if (values.length <= targetLength) return values;
  const step = values.length / targetLength;
  const result: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    result.push(values[Math.floor(i * step)]);
  }
  return result;
}

// The player must keep a finger on the screen from the start of the
// countdown through the end of the run. Letting go cancels it immediately.
// This is the anti-propping measure: setting the phone down on a surface
// necessarily releases the touch, so a truly still run can only come from
// someone actively holding it. The tradeoff is that this interaction model
// doesn't have a clean screen-reader equivalent yet (hold gestures don't map
// to VoiceOver's double-tap-to-activate), which is a known gap for later.
export function PlayScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { trace, start, stop, getFrames } = useMovementSession();
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(COUNT_START);
  const [secondsLeft, setSecondsLeft] = useState(RUN_DURATION_SECONDS);
  const [releasedEarly, setReleasedEarly] = useState(false);

  const heldRef = useRef(false);
  const finishedRef = useRef(false);

  const resetToIdle = useCallback(() => {
    heldRef.current = false;
    finishedRef.current = false;
    setPhase('idle');
    setCount(COUNT_START);
    setSecondsLeft(RUN_DURATION_SECONDS);
  }, []);

  const cancelRun = useCallback(() => {
    stop();
    resetToIdle();
    setReleasedEarly(true);
    hapticReleasedEarly();
  }, [stop, resetToIdle]);

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
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, RUN_DURATION_SECONDS - elapsedSeconds);
      setSecondsLeft(Math.ceil(remaining));

      if (remaining <= 0 && !finishedRef.current) {
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
    const traceSnapshot = downsample(frames, STORED_TRACE_LENGTH);

    const { isPersonalBest, bestScore } = await saveRun({
      score,
      movementScore,
      trace: traceSnapshot,
      createdAt: new Date().toISOString(),
    });

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
    setReleasedEarly(false);
    setPhase('countdown');
  };

  const handlePressOut = () => {
    if (finishedRef.current) return;
    if (!heldRef.current) return;
    heldRef.current = false;
    cancelRun();
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
        <View style={styles.center}>
          <Text style={styles.prompt}>Press and hold to begin</Text>
          {releasedEarly && <Text style={styles.releasedText}>Let go too soon. Try again.</Text>}
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
  center: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  prompt: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  releasedText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  countText: {
    color: colors.accent,
    fontSize: 96,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  runningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxl,
  },
  timer: {
    color: colors.textPrimary,
    fontSize: 120,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  traceWrapper: {
    width: '100%',
  },
});

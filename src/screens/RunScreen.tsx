import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { TRACE_LENGTH, useMovementSession } from '../lib/sensors';
import { computeScore } from '../lib/scoring';
import { saveRun } from '../lib/storage';
import { SeismographTrace } from '../components/SeismographTrace';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Run'>;

const RUN_DURATION_SECONDS = 20;
const STORED_TRACE_LENGTH = 60;

function downsample(values: number[], targetLength: number): number[] {
  if (values.length <= targetLength) return values;
  const step = values.length / targetLength;
  const result: number[] = [];
  for (let i = 0; i < targetLength; i++) {
    result.push(values[Math.floor(i * step)]);
  }
  return result;
}

export function RunScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { trace, start, stop, getFrames } = useMovementSession();
  const [secondsLeft, setSecondsLeft] = useState(RUN_DURATION_SECONDS);
  const finishedRef = useRef(false);

  useEffect(() => {
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

    return () => {
      clearInterval(interval);
      stop();
    };
    // Run start/stop should only ever fire once per mount of this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{secondsLeft}</Text>
      <View style={styles.traceWrapper}>
        <SeismographTrace values={trace} width={width} height={120} capacity={TRACE_LENGTH} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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

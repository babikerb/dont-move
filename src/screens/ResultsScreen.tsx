import React, { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SeismographTrace } from '../components/SeismographTrace';
import { formatPercentile } from '../lib/percentile';
import { getResultMessage } from '../lib/resultMessages';
import { hapticButton, hapticPersonalBest } from '../lib/haptics';
import { playSound } from '../lib/sound';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { score, trace, isPersonalBest } = route.params;
  const { width } = useWindowDimensions();
  const scoreScale = useRef(new Animated.Value(isPersonalBest ? 0.85 : 1)).current;

  // Picked once per run so it doesn't change on re-render, and skipped for a
  // personal best since the PERSONAL BEST banner already carries that moment.
  const resultMessage = useMemo(
    () => (isPersonalBest ? null : getResultMessage(score)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (isPersonalBest) {
      hapticPersonalBest();
      playSound('pb');
      Animated.spring(scoreScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }).start();
    }
    // Only replay the personal-best animation once, when this screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAgain = () => {
    hapticButton();
    navigation.replace('Countdown');
  };

  const handleShare = () => {
    hapticButton();
    Alert.alert('Share', 'Coming soon.');
  };

  const handleHome = () => {
    hapticButton();
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.Text style={[styles.score, { transform: [{ scale: scoreScale }] }]}>
          {score.toFixed(2)}
        </Animated.Text>
        <Text style={styles.percentile}>{formatPercentile(score)}</Text>
        {resultMessage && <Text style={styles.resultMessage}>{resultMessage}</Text>}

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={width - spacing.lg * 4} height={60} strokeWidth={1.5} />
        </View>

        {isPersonalBest && <Text style={styles.personalBest}>PERSONAL BEST</Text>}
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.primaryButton]} onPress={handlePlayAgain}>
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>Share</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={handleHome}>
          <Text style={styles.secondaryButtonText}>Home</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  score: {
    color: colors.textPrimary,
    fontSize: 80,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  percentile: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '600',
  },
  resultMessage: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  traceWrapper: {
    marginTop: spacing.lg,
  },
  personalBest: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  actions: {
    gap: spacing.sm,
  },
  button: {
    paddingVertical: spacing.md,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/TabNavigator';
import { getBestScore } from '../lib/storage';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing } from '../theme/colors';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [bestScore, setBestScore] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getBestScore().then((score) => {
        if (!cancelled) setBestScore(score);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handlePlay = () => {
    tapFeedback();
    navigation.navigate('Play');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl }]}>
      <View style={styles.center}>
        <Text style={styles.logo}>DON'T MOVE</Text>

        <View style={styles.bestScoreBlock}>
          <Text style={styles.bestScoreLabel}>BEST SCORE</Text>
          {bestScore !== null ? (
            <Text
              style={styles.bestScoreValue}
              accessibilityLabel={`Best score ${bestScore.toFixed(2)}`}
            >
              {bestScore.toFixed(2)}
            </Text>
          ) : (
            <Text style={styles.bestScoreEmpty}>Play your first run</Text>
          )}
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}
        onPress={handlePlay}
        accessibilityRole="button"
        accessibilityLabel="Play"
      >
        <Text style={styles.playButtonText}>PLAY</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bestScoreBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  bestScoreLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  bestScoreValue: {
    color: colors.textPrimary,
    fontSize: 64,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bestScoreEmpty: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
  },
  playButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  playButtonPressed: {
    opacity: 0.85,
  },
  playButtonText: {
    color: colors.onAccent,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

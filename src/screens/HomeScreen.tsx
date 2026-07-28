import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/TabNavigator';
import { Button } from '../components/Button';
import { getBestScore } from '../lib/storage';
import { tapFeedback } from '../lib/feedback';
import { colors, fontFamily, spacing, type } from '../theme/colors';

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
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.wordmark}>DON'T MOVE</Text>

      <View style={styles.center}>
        <Text style={styles.bestScoreLabel}>BEST SCORE</Text>
        {bestScore !== null ? (
          <Text style={styles.bestScoreValue} accessibilityLabel={`Best score ${bestScore.toFixed(2)}`}>
            {bestScore.toFixed(2)}
          </Text>
        ) : (
          <Text style={styles.bestScoreEmpty}>NO RUNS YET</Text>
        )}
      </View>

      <Button label="Play" onPress={handlePlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },
  wordmark: {
    color: colors.textSecondary,
    fontSize: type.label,
    fontWeight: '700',
    letterSpacing: 3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  bestScoreLabel: {
    color: colors.textSecondary,
    fontSize: type.label,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bestScoreValue: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoBold,
    fontSize: type.display,
  },
  bestScoreEmpty: {
    color: colors.textTertiary,
    fontSize: type.heading,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

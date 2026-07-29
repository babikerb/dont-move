import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HomeScreenProps } from '../navigation/TabNavigator';
import { Button } from '../components/Button';
import { SignInBanner } from '../components/SignInBanner';
import { getBestScore, reconcileBestScore } from '../lib/storage';
import { useMyStats } from '../lib/statsQuery';
import { isAnonymousSession } from '../lib/supabase';
import { tapFeedback } from '../lib/feedback';
import { colors, fontFamily, spacing, type } from '../theme/colors';

export function HomeScreen({ navigation }: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isGuest, setIsGuest] = useState(true);
  // Home is a persistent tab screen, so this hook stays mounted and
  // reactively refetches whenever ['myStats'] is invalidated elsewhere
  // (e.g. right after signing in) - no need to wait for the player to
  // revisit this tab.
  const { data: stats } = useMyStats();

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getBestScore(), isAnonymousSession()]).then(([score, anon]) => {
        if (cancelled) return;
        setBestScore(score);
        setIsGuest(anon);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    if (stats === undefined) return;
    reconcileBestScore(stats?.bestScore ?? null).then(setBestScore);
  }, [stats]);

  const handlePlay = () => {
    tapFeedback();
    navigation.navigate('Play');
  };

  const handleSignIn = () => {
    tapFeedback();
    navigation.navigate('Account');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.wordmark}>PAUSE</Text>

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

      <View style={styles.bottom}>
        {isGuest && (
          <SignInBanner message="Sign in to save your progress." onPress={handleSignIn} />
        )}
        <Button label="Play" onPress={handlePlay} />
      </View>
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
  bottom: {
    gap: spacing.sm,
  },
});

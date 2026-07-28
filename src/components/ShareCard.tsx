import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SeismographTrace } from './SeismographTrace';
import { formatPercentile } from '../lib/percentile';
import { colors } from '../theme/colors';

export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 640;

interface ShareCardProps {
  score: number;
  trace: number[];
  isPersonalBest: boolean;
  // Passed down from Results so the card shows the exact same percentile
  // (live if it resolved there, the static estimate otherwise) rather than
  // recomputing its own and risking the two disagreeing.
  percentileText?: string;
}

export function ShareCard({ score, trace, isPersonalBest, percentileText }: ShareCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.wordmark}>DON'T MOVE</Text>

      <View style={styles.center}>
        <Text style={styles.score} numberOfLines={1} adjustsFontSizeToFit>
          {score.toFixed(2)}
        </Text>
        <Text style={styles.percentile}>{percentileText ?? formatPercentile(score)}</Text>

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={SHARE_CARD_WIDTH - 96} height={64} />
        </View>

        {isPersonalBest && <Text style={styles.personalBest}>PERSONAL BEST</Text>}
      </View>

      <Text style={styles.tagline}>Can you beat me?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
  },
  wordmark: {
    position: 'absolute',
    top: 56,
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  center: {
    alignItems: 'center',
    gap: 8,
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
  traceWrapper: {
    marginTop: 24,
  },
  personalBest: {
    marginTop: 24,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  tagline: {
    position: 'absolute',
    bottom: 56,
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});

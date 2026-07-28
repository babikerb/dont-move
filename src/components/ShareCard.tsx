import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { SeismographTrace } from './SeismographTrace';
import { formatPercentile } from '../lib/percentile';
import { SHARE_URL } from '../config';
import { colors } from '../theme/colors';

export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 640;

interface ShareCardProps {
  score: number;
  trace: number[];
  isPersonalBest: boolean;
}

export function ShareCard({ score, trace, isPersonalBest }: ShareCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.logo}>DON'T MOVE</Text>

      <View style={styles.center}>
        <Text style={styles.score}>{score.toFixed(2)}</Text>
        <Text style={styles.percentile}>{formatPercentile(score).toUpperCase()}</Text>
        {isPersonalBest && <Text style={styles.personalBest}>PERSONAL BEST</Text>}

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={SHARE_CARD_WIDTH - 96} height={64} strokeWidth={2} />
        </View>

        <Text style={styles.tagline}>Can you beat me?</Text>
      </View>

      <View style={styles.qrWrapper}>
        <QRCodeStyled data={SHARE_URL} size={100} padding={10} color={colors.background} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 56,
    paddingHorizontal: 32,
  },
  logo: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
  center: {
    alignItems: 'center',
  },
  score: {
    color: colors.textPrimary,
    fontSize: 88,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  percentile: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 8,
  },
  personalBest: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  traceWrapper: {
    marginTop: 24,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 28,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
  },
});

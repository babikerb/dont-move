import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from './Avatar';
import { SeismographTrace } from './SeismographTrace';
import { formatPercentile } from '../lib/percentile';
import { colors, fontFamily } from '../theme/colors';

// Square canvas rather than a 9:16 story shape: chat apps (iMessage,
// WhatsApp, X timeline) show shared images center-cropped toward square in
// their inline preview, so a square canvas with all critical content kept
// inside a centered safe area survives that crop instead of losing its top
// and bottom to it. At the device's typical 3x capture scale this exports
// at 1080x1080; SAFE_PADDING (140/1080 of the canvas) keeps content inside
// an ~800x800 safe area.
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 360;
const SAFE_PADDING = 48;

interface ShareCardProps {
  score: number;
  trace: number[];
  isPersonalBest: boolean;
  // Passed down from Results so the card shows the exact same percentile
  // (live if it resolved there, the static estimate otherwise) rather than
  // recomputing its own and risking the two disagreeing.
  percentileText?: string;
  // Whoever just played, so the card is recognizable as *their* result
  // rather than a generic score screenshot. Falls back to GUEST, matching
  // the same convention used on the Leaderboard for anonymous players.
  username?: string | null;
  avatarId?: string | null;
}

export function ShareCard({
  score,
  trace,
  isPersonalBest,
  percentileText,
  username,
  avatarId,
}: ShareCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.wordmark}>DON'T MOVE</Text>

      <View style={styles.center}>
        <View style={styles.identity}>
          <Avatar id={avatarId} size={24} />
          <Text style={styles.username} numberOfLines={1}>
            {username ?? 'GUEST'}
          </Text>
        </View>

        <Text style={styles.score} numberOfLines={1} adjustsFontSizeToFit>
          {score.toFixed(2)}
        </Text>
        <Text style={styles.percentile}>{percentileText ?? formatPercentile(score)}</Text>

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={SHARE_CARD_WIDTH - SAFE_PADDING * 2} height={44} />
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
    paddingHorizontal: SAFE_PADDING,
    paddingVertical: SAFE_PADDING,
    gap: 12,
  },
  wordmark: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  center: {
    alignItems: 'center',
    gap: 6,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  username: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  score: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoBold,
    fontSize: 48,
  },
  percentile: {
    color: colors.accentAmber,
    fontSize: 16,
    fontWeight: '600',
  },
  traceWrapper: {
    marginTop: 14,
  },
  personalBest: {
    marginTop: 14,
    color: colors.accentGreen,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});

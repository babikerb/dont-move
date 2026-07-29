import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Button } from '../components/Button';
import { SeismographTrace } from '../components/SeismographTrace';
import { ShareCard } from '../components/ShareCard';
import { formatPercentile, formatTopPercent } from '../lib/percentile';
import { fetchScorePercentile } from '../lib/leaderboard';
import { useMyProfile } from '../lib/profileQuery';
import { getResultMessage } from '../lib/resultMessages';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { playSound } from '../lib/sound';
import { trackPlayAgain, trackShared } from '../lib/analytics';
import { colors, fontFamily, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { score, trace, isPersonalBest } = route.params;
  const { width } = useWindowDimensions();
  const { data: profile } = useMyProfile();
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  // Static estimate renders immediately so the screen never waits on a
  // network round trip; swapped for the live value from Supabase if/when it
  // resolves. Falls back to staying on the estimate when offline.
  const [percentileText, setPercentileText] = useState(() => formatPercentile(score));

  useEffect(() => {
    let cancelled = false;
    fetchScorePercentile(score).then((topPercent) => {
      if (cancelled || topPercent === null) return;
      setPercentileText(formatTopPercent(topPercent));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picked once per run so it doesn't change on re-render, and skipped for a
  // personal best since the PERSONAL BEST banner already carries that moment.
  const resultMessage = useMemo(
    () => (isPersonalBest ? null : getResultMessage(score)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;

      if (reduced) {
        scoreOpacity.setValue(1);
      } else {
        // Fast, no overshoot - a confirming appearance, not a bounce.
        Animated.timing(scoreOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }

      if (isPersonalBest) {
        hapticPersonalBest();
        playSound('pb');
      }
    });

    return () => {
      cancelled = true;
    };
    // Only replay the reveal animation once, when this screen mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayAgain = () => {
    tapFeedback();
    trackPlayAgain();
    navigation.replace('Play');
  };

  const handleShare = async () => {
    tapFeedback();
    if (isSharing) return;

    setIsSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }

      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      await Sharing.shareAsync(fileUri, { mimeType: 'image/png', dialogTitle: 'Share your score' });
      trackShared();
    } catch {
      Alert.alert('Share failed', 'Something went wrong creating your share image.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleHome = () => {
    tapFeedback();
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.Text style={[styles.score, { opacity: scoreOpacity }]}>
          {score.toFixed(2)}
        </Animated.Text>
        <Text style={styles.percentile}>{percentileText}</Text>
        {resultMessage && <Text style={styles.resultMessage}>{resultMessage}</Text>}

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={width - spacing.lg * 4} height={60} animateIn />
        </View>

        {isPersonalBest && <Text style={styles.personalBest}>PERSONAL BEST</Text>}
      </View>

      <View style={styles.offscreen} collapsable={false}>
        <View ref={shareCardRef} collapsable={false}>
          <ShareCard
            score={score}
            trace={trace}
            isPersonalBest={isPersonalBest}
            percentileText={percentileText}
            username={profile?.username ?? 'GUEST'}
            avatarId={profile?.avatarId}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Play Again" onPress={handlePlayAgain} />
        <Button
          label={isSharing ? 'Sharing...' : 'Share'}
          onPress={handleShare}
          disabled={isSharing}
          variant="secondary"
        />
        <Button label="Home" onPress={handleHome} variant="secondary" />
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
    gap: spacing.sm,
  },
  score: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoBold,
    fontSize: type.display,
  },
  percentile: {
    color: colors.accentAmber,
    fontSize: type.heading,
    fontWeight: '600',
  },
  resultMessage: {
    color: colors.textSecondary,
    fontSize: type.body,
    fontWeight: '500',
  },
  traceWrapper: {
    marginTop: spacing.lg,
  },
  personalBest: {
    marginTop: spacing.lg,
    color: colors.accentGreen,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
  },
  actions: {
    gap: spacing.sm,
  },
});

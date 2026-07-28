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
import { SeismographTrace } from '../components/SeismographTrace';
import { ShareCard } from '../components/ShareCard';
import { formatPercentile } from '../lib/percentile';
import { getResultMessage } from '../lib/resultMessages';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { playSound } from '../lib/sound';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Results'>;

export function ResultsScreen({ navigation, route }: Props) {
  const { score, trace, isPersonalBest } = route.params;
  const { width } = useWindowDimensions();
  const scoreScale = useRef(new Animated.Value(0.85)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const shareCardRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

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
        scoreScale.setValue(1);
        scoreOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(scoreScale, {
            toValue: 1,
            friction: isPersonalBest ? 4 : 6,
            tension: isPersonalBest ? 70 : 50,
            useNativeDriver: true,
          }),
          Animated.timing(scoreOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
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
        <Animated.Text
          style={[styles.score, { opacity: scoreOpacity, transform: [{ scale: scoreScale }] }]}
        >
          {score.toFixed(2)}
        </Animated.Text>
        <Text style={styles.percentile}>{formatPercentile(score)}</Text>
        {resultMessage && <Text style={styles.resultMessage}>{resultMessage}</Text>}

        <View style={styles.traceWrapper}>
          <SeismographTrace values={trace} width={width - spacing.lg * 4} height={60} animateIn />
        </View>

        {isPersonalBest && <Text style={styles.personalBest}>PERSONAL BEST</Text>}
      </View>

      <View style={styles.offscreen} collapsable={false}>
        <View ref={shareCardRef} collapsable={false}>
          <ShareCard score={score} trace={trace} isPersonalBest={isPersonalBest} />
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={handlePlayAgain}
          accessibilityRole="button"
          accessibilityLabel="Play again"
        >
          <Text style={styles.primaryButtonText}>Play Again</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={handleShare}
          disabled={isSharing}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Text style={styles.secondaryButtonText}>{isSharing ? 'Sharing...' : 'Share'}</Text>
        </Pressable>
        <Pressable
          style={styles.button}
          onPress={handleHome}
          accessibilityRole="button"
          accessibilityLabel="Home"
        >
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
  offscreen: {
    position: 'absolute',
    top: 0,
    left: -10000,
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
    color: colors.onAccent,
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});

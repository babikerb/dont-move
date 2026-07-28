import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, ViewStyle } from 'react-native';
import { colors, radius } from '../theme/colors';

interface SkeletonProps {
  width?: number | `${number}%`;
  height: number;
  cornerRadius?: number;
  style?: ViewStyle;
}

// Subtle breathing opacity rather than a shimmer sweep - a loading
// affordance, not a decorative effect. Static (no animation) when reduce
// motion is on.
export function Skeleton({ width = '100%', height, cornerRadius = radius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled || reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.9, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      loop?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: cornerRadius, backgroundColor: colors.surface, opacity },
        style,
      ]}
    />
  );
}

import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Point {
  x: number;
  y: number;
}

interface SeismographTraceProps {
  values: number[];
  width: number;
  height: number;
  maxScale?: number;
  strokeWidth?: number;
  // Total capacity of the ring buffer feeding `values`. When set, spacing
  // between points is fixed to width / (capacity - 1) and the newest point is
  // pinned to the right edge, so a still-filling buffer looks like a strip
  // chart scrolling in from second one rather than a line stretching to fill
  // the width as points accumulate. Omit for a fixed-length static snapshot
  // (e.g. the Results screen), which should still stretch to fit.
  capacity?: number;
  // Draws the line in once on mount instead of appearing all at once.
  // Skipped in favor of an instant reveal when the system's reduce motion
  // setting is on.
  animateIn?: boolean;
}

// Values are an unsigned movement magnitude, not a directional signal, so
// alternating the sign per sample is what gives the trace its EKG/seismograph
// silhouette: a real flatline when values are near 0, a spiky trace otherwise.
function buildPoints(
  values: number[],
  width: number,
  height: number,
  maxScale: number,
  capacity: number
): Point[] {
  const midY = height / 2;

  if (values.length < 2) {
    return [
      { x: 0, y: midY },
      { x: width, y: midY },
    ];
  }

  const amplitude = midY * 0.85;
  const step = width / (capacity - 1);
  const leadingGap = capacity - values.length;

  return values.map((value, i) => {
    const clamped = Math.min(value, maxScale) / maxScale;
    const sign = i % 2 === 0 ? 1 : -1;
    const y = midY - sign * clamped * amplitude;
    const x = (leadingGap + i) * step;
    return { x, y };
  });
}

function pointsToPath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

export function SeismographTrace({
  values,
  width,
  height,
  maxScale = 12,
  strokeWidth = 2,
  capacity,
  animateIn = false,
}: SeismographTraceProps) {
  const effectiveCapacity = capacity ?? values.length;
  const points = useMemo(
    () => buildPoints(values, width, height, maxScale, effectiveCapacity),
    [values, width, height, maxScale, effectiveCapacity]
  );
  const path = useMemo(() => pointsToPath(points), [points]);
  const length = useMemo(() => pathLength(points), [points]);

  const progress = useRef(new Animated.Value(animateIn ? 0 : 1)).current;

  useEffect(() => {
    if (!animateIn) return;
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        progress.setValue(1);
        return;
      }
      Animated.timing(progress, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      cancelled = true;
    };
    // One-time reveal on mount, not tied to later re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [length, 0],
  });

  const dashProps = animateIn
    ? { strokeDasharray: [length, length], strokeDashoffset }
    : {};

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <AnimatedPath
          d={path}
          stroke={colors.accent}
          strokeWidth={strokeWidth * 3}
          strokeOpacity={0.18}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...dashProps}
        />
        <AnimatedPath
          d={path}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          {...dashProps}
        />
      </Svg>
    </View>
  );
}

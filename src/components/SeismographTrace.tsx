import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme/colors';

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
}

// Values are an unsigned movement magnitude, not a directional signal, so
// alternating the sign per sample is what gives the trace its EKG/seismograph
// silhouette: a real flatline when values are near 0, a spiky trace otherwise.
function buildPath(
  values: number[],
  width: number,
  height: number,
  maxScale: number,
  capacity: number
): string {
  const midY = height / 2;

  if (values.length < 2) {
    return `M0,${midY} L${width},${midY}`;
  }

  const amplitude = midY * 0.85;
  const step = width / (capacity - 1);
  const leadingGap = capacity - values.length;

  return values
    .map((value, i) => {
      const clamped = Math.min(value, maxScale) / maxScale;
      const sign = i % 2 === 0 ? 1 : -1;
      const y = midY - sign * clamped * amplitude;
      const x = (leadingGap + i) * step;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
}

export function SeismographTrace({
  values,
  width,
  height,
  maxScale = 12,
  strokeWidth = 2,
  capacity,
}: SeismographTraceProps) {
  const effectiveCapacity = capacity ?? values.length;
  const path = useMemo(
    () => buildPath(values, width, height, maxScale, effectiveCapacity),
    [values, width, height, maxScale, effectiveCapacity]
  );

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={path}
          stroke={colors.accent}
          strokeWidth={strokeWidth * 3}
          strokeOpacity={0.18}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={path}
          stroke={colors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

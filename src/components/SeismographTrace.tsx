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
}

// Values are an unsigned movement magnitude, not a directional signal, so
// alternating the sign per sample is what gives the trace its EKG/seismograph
// silhouette: a real flatline when values are near 0, a spiky trace otherwise.
function buildPath(values: number[], width: number, height: number, maxScale: number): string {
  const midY = height / 2;

  if (values.length < 2) {
    return `M0,${midY} L${width},${midY}`;
  }

  const amplitude = midY * 0.85;
  const step = width / (values.length - 1);

  return values
    .map((value, i) => {
      const clamped = Math.min(value, maxScale) / maxScale;
      const sign = i % 2 === 0 ? 1 : -1;
      const y = midY - sign * clamped * amplitude;
      const x = i * step;
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
}: SeismographTraceProps) {
  const path = useMemo(
    () => buildPath(values, width, height, maxScale),
    [values, width, height, maxScale]
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

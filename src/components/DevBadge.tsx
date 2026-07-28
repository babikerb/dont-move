import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';

interface DevBadgeProps {
  size?: number;
}

export function DevBadge({ size = 16 }: DevBadgeProps) {
  return (
    <View
      style={[styles.badge, { width: size * 1.6, height: size * 1.6, borderRadius: radius.sm }]}
      accessibilityLabel="Developer"
    >
      <Ionicons name="construct" size={size} color={colors.background} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

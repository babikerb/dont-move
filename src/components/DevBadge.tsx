import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DEV_ORANGE = '#FF9F0A';

interface DevBadgeProps {
  size?: number;
}

export function DevBadge({ size = 16 }: DevBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { width: size * 1.6, height: size * 1.6, borderRadius: size * 0.8 },
      ]}
      accessibilityLabel="Developer"
    >
      <Ionicons name="construct" size={size} color="#000000" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: DEV_ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

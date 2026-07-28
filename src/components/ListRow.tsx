import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, spacing, type } from '../theme/colors';

interface ListRowProps {
  label: string;
  value?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  border?: boolean;
  accessibilityLabel?: string;
}

// One shared row shape used across Settings, Leaderboard, and anywhere else
// a label/value pair needs to line up - compact, hairline-separated, no
// card chrome.
export function ListRow({
  label,
  value,
  left,
  right,
  onPress,
  border = true,
  accessibilityLabel,
}: ListRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, border && styles.border, onPress && pressed && styles.pressed]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {left}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {right}
      {value !== undefined && <Text style={styles.value}>{value}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  border: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: type.body,
    fontWeight: '500',
  },
  value: {
    color: colors.accentAmber,
    fontFamily: fontFamily.monoSemiBold,
    fontSize: type.body,
  },
});

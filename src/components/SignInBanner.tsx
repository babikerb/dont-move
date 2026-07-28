import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme/colors';

interface SignInBannerProps {
  message: string;
  onPress: () => void;
}

// Shown wherever a guest is missing out on something account-gated
// (leaderboard rank, synced stats, cross-device history) - a nudge, not a
// blocking wall, per CLAUDE.md's "authentication should feel like an
// upgrade, not a requirement."
export function SignInBanner({ message, onPress }: SignInBannerProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.banner, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${message} Sign in.`}
    >
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.action}>SIGN IN</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.accentTeal,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  message: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: type.caption,
  },
  action: {
    color: colors.accentTeal,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

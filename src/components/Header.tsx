import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../theme/colors';

interface HeaderAction {
  label: string;
  onPress: () => void;
}

interface HeaderProps {
  title: string;
  action?: HeaderAction;
  divider?: boolean;
}

// Fully custom, never the default React Navigation header (CLAUDE.md).
// Fixed height, left-aligned editorial title, one optional text action,
// optional hairline divider - no back chevrons, no oversized chrome.
export function Header({ title, action, divider = false }: HeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md },
        divider && styles.divider,
      ]}
    >
      <Text style={styles.title}>{title}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Text style={styles.actionLabel}>{action.label.toUpperCase()}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    minHeight: 56,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: type.title,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionLabel: {
    color: colors.accentGreen,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

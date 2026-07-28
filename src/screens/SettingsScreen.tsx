import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { isHapticsEnabled, isSoundEnabled, setHapticsEnabled, setSoundEnabled } from '../lib/settings';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled());

  const handleToggleSound = (value: boolean) => {
    setSoundOn(value);
    setSoundEnabled(value);
  };

  const handleToggleHaptics = (value: boolean) => {
    setHapticsOn(value);
    setHapticsEnabled(value);
  };

  const handleDone = () => {
    tapFeedback();
    navigation.goBack();
  };

  const handleStub = (label: string) => {
    tapFeedback();
    Alert.alert(label, 'Coming soon.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Settings</Text>
        <Pressable onPress={handleDone} hitSlop={16} accessibilityRole="button" accessibilityLabel="Done">
          <Text style={styles.doneLabel}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sound</Text>
            <Switch
              value={soundOn}
              onValueChange={handleToggleSound}
              trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
              thumbColor={colors.switchThumb}
              accessibilityLabel="Sound"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Haptics</Text>
            <Switch
              value={hapticsOn}
              onValueChange={handleToggleHaptics}
              trackColor={{ false: colors.switchTrackOff, true: colors.accent }}
              thumbColor={colors.switchThumb}
              accessibilityLabel="Haptics"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Pressable
            style={styles.row}
            onPress={() => handleStub('Privacy')}
            accessibilityRole="button"
            accessibilityLabel="Privacy"
          >
            <Text style={styles.rowLabel}>Privacy</Text>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.row}
            onPress={() => handleStub('Sign In')}
            accessibilityRole="button"
            accessibilityLabel="Sign in or manage account"
          >
            <Text style={styles.rowLabel}>Sign In</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.aboutText}>Don't Move. Hold your phone as still as possible.</Text>
          <Text style={styles.versionText}>Version 0.1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  doneLabel: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  rowLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.md,
  },
  versionText: {
    color: colors.textTertiary,
    fontSize: 13,
    paddingBottom: spacing.md,
  },
});

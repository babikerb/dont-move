import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProfileScreenProps } from '../navigation/TabNavigator';
import { Avatar } from '../components/Avatar';
import { DevBadge } from '../components/DevBadge';
import { useMyProfile } from '../lib/profileQuery';
import { useMyStats } from '../lib/statsQuery';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing } from '../theme/colors';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: profile, isPending: profilePending } = useMyProfile();
  const { data: stats, isPending: statsPending } = useMyStats();

  const handleChangeAvatar = () => {
    tapFeedback();
    navigation.navigate('AvatarPicker');
  };

  const handleSettings = () => {
    tapFeedback();
    navigation.navigate('Settings');
  };

  const statRows: { label: string; value: string }[] = statsPending
    ? []
    : [
        { label: 'Total Runs', value: String(stats?.totalRuns ?? 0) },
        { label: 'Personal Best', value: stats?.bestScore != null ? stats.bestScore.toFixed(2) : '-' },
        { label: 'Average Score', value: stats?.averageScore != null ? stats.averageScore.toFixed(2) : '-' },
        { label: 'Playing Since', value: stats?.firstRunAt ? formatDate(stats.firstRunAt) : '-' },
      ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          onPress={handleSettings}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.settingsLabel}>Settings</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <Pressable
            onPress={handleChangeAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change avatar"
          >
            {profilePending ? (
              <View style={styles.avatarSkeleton} />
            ) : (
              <Avatar id={profile?.avatarId} size={88} />
            )}
          </Pressable>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{profilePending ? ' ' : profile?.username ?? 'Player'}</Text>
            {profile?.isDev && <DevBadge />}
          </View>
          <Pressable onPress={handleChangeAvatar} accessibilityRole="button">
            <Text style={styles.changeAvatarText}>Change avatar</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          {statsPending ? (
            <View style={styles.statsLoading}>
              <Text style={styles.statsLoadingText}>Loading stats...</Text>
            </View>
          ) : (
            statRows.map((row, index) => (
              <React.Fragment key={row.label}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.statValue}>{row.value}</Text>
                </View>
                {index < statRows.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  settingsLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  avatarSkeleton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  changeAvatarText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
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
  statValue: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statsLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statsLoadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

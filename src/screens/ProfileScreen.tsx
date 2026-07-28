import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProfileScreenProps } from '../navigation/TabNavigator';
import { Header } from '../components/Header';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { DevBadge } from '../components/DevBadge';
import { useMyProfile } from '../lib/profileQuery';
import { useMyStats } from '../lib/statsQuery';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
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

  const handleViewAllRuns = () => {
    tapFeedback();
    navigation.navigate('RunHistory');
  };

  const statRows: { label: string; value: string }[] = statsPending
    ? []
    : [
        { label: 'TOTAL RUNS', value: String(stats?.totalRuns ?? 0) },
        { label: 'PERSONAL BEST', value: stats?.bestScore != null ? stats.bestScore.toFixed(2) : '-' },
        { label: 'AVERAGE SCORE', value: stats?.averageScore != null ? stats.averageScore.toFixed(2) : '-' },
        { label: 'PLAYING SINCE', value: stats?.firstRunAt ? formatDate(stats.firstRunAt) : '-' },
      ];

  return (
    <View style={styles.container}>
      <Header title="Profile" action={{ label: 'Settings', onPress: handleSettings }} divider />

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
            <Text style={styles.changeAvatarText}>CHANGE AVATAR</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          {statsPending ? (
            <View style={styles.statsLoading}>
              <Text style={styles.statsLoadingText}>LOADING STATS...</Text>
            </View>
          ) : (
            statRows.map((row) => <ListRow key={row.label} label={row.label} value={row.value} />)
          )}
          <ListRow label="VIEW ALL RUNS" onPress={handleViewAllRuns} border={false} />
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
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatarSkeleton: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
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
    fontSize: type.heading,
    fontWeight: '700',
  },
  changeAvatarText: {
    color: colors.accentGreen,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  statsLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statsLoadingText: {
    color: colors.textSecondary,
    fontSize: type.caption,
    letterSpacing: 0.5,
  },
});

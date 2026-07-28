import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ProfileScreenProps } from '../navigation/TabNavigator';
import { Header } from '../components/Header';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { DevBadge } from '../components/DevBadge';
import { Skeleton } from '../components/Skeleton';
import { SignInBanner } from '../components/SignInBanner';
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
  const { data: profile, isPending: profilePending, refetch: refetchProfile } = useMyProfile();
  const { data: stats, isPending: statsPending, refetch: refetchStats } = useMyStats();
  const [refreshing, setRefreshing] = useState(false);

  const isGuest = !profilePending && !profile;

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

  const handleSignIn = () => {
    tapFeedback();
    navigation.navigate('Account');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchStats()]);
    setRefreshing(false);
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accentGreen} />
        }
      >
        <View style={styles.avatarBlock}>
          <Pressable
            onPress={handleChangeAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change avatar"
          >
            {profilePending ? (
              <Skeleton width={88} height={88} cornerRadius={radius.lg} />
            ) : (
              <Avatar id={profile?.avatarId} size={88} />
            )}
          </Pressable>
          <View style={styles.usernameRow}>
            <Text style={styles.username}>{profilePending ? ' ' : profile?.username ?? 'GUEST'}</Text>
            {profile?.isDev && <DevBadge />}
          </View>
          <Pressable onPress={handleChangeAvatar} accessibilityRole="button">
            <Text style={styles.changeAvatarText}>CHANGE AVATAR</Text>
          </Pressable>
        </View>

        {isGuest && (
          <SignInBanner
            message="Sign in to sync your profile and stats."
            onPress={handleSignIn}
          />
        )}

        <View style={styles.section}>
          {statsPending ? (
            <View style={styles.statsSkeleton}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} style={styles.statSkeletonRow}>
                  <Skeleton width="40%" height={14} />
                  <Skeleton width={48} height={14} />
                </View>
              ))}
            </View>
          ) : (
            statRows.map((row) => <ListRow key={row.label} label={row.label} value={row.value} />)
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.viewAllRuns, pressed && styles.viewAllRunsPressed]}
          onPress={handleViewAllRuns}
          accessibilityRole="button"
          accessibilityLabel="View all runs"
        >
          <Text style={styles.viewAllRunsText}>VIEW ALL RUNS</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </Pressable>
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
  viewAllRuns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  viewAllRunsPressed: {
    opacity: 0.7,
  },
  viewAllRunsText: {
    color: colors.textPrimary,
    fontSize: type.body,
    fontWeight: '500',
  },
  statsSkeleton: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  statSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { DevBadge } from '../components/DevBadge';
import {
  fetchLeaderboard,
  fetchMyRank,
  LeaderboardEntry,
  LeaderboardWindow,
  MyRank,
} from '../lib/leaderboard';
import { supabase } from '../lib/supabase';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing } from '../theme/colors';

const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'all_time', label: 'All Time' },
];

export function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const [window, setWindow] = useState<LeaderboardWindow>('today');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<MyRank | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (w: LeaderboardWindow) => {
    setLoading(true);
    const [{ data }, list, rank] = await Promise.all([
      supabase.auth.getSession(),
      fetchLeaderboard(w),
      fetchMyRank(w),
    ]);
    setMyUserId(data.session?.user.id ?? null);
    setEntries(list);
    setMyRank(rank);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(window);
      // Only refresh on focus/window change, not every time `load` is recreated.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [window])
  );

  const handleSelectWindow = (w: LeaderboardWindow) => {
    tapFeedback();
    setWindow(w);
  };

  const amInTopList = myUserId !== null && entries.some((e) => e.userId === myUserId);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Leaderboard</Text>

      <View style={styles.tabRow}>
        {WINDOWS.map((w) => (
          <Pressable
            key={w.key}
            style={[styles.tab, window === w.key && styles.tabActive]}
            onPress={() => handleSelectWindow(w.key)}
            accessibilityRole="button"
            accessibilityLabel={w.label}
          >
            <Text style={[styles.tabText, window === w.key && styles.tabTextActive]}>{w.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No runs yet. Be the first.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.row, item.userId === myUserId && styles.rowMe]}>
              <Text style={styles.rank}>{item.rank}</Text>
              <Avatar id={item.avatarId} size={36} />
              <View style={styles.usernameRow}>
                <Text style={styles.username} numberOfLines={1}>
                  {item.username ?? 'Player'}
                </Text>
                {item.isDev && <DevBadge size={12} />}
              </View>
              <Text style={styles.score}>{item.score.toFixed(2)}</Text>
            </View>
          )}
        />
      )}

      {!loading && myRank && !amInTopList && (
        <View style={styles.myRankFooter}>
          <Text style={styles.myRankText}>
            Your rank: #{myRank.rank} of {myRank.total} - {myRank.score.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.onAccent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  rowMe: {
    backgroundColor: colors.surface,
  },
  rank: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
    width: 28,
  },
  usernameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  username: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  score: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  myRankFooter: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  myRankText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

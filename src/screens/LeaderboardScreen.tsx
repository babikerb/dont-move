import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { DevBadge } from '../components/DevBadge';
import { Skeleton } from '../components/Skeleton';
import { SignInBanner } from '../components/SignInBanner';
import { LeaderboardScope, LeaderboardWindow, MyRank } from '../lib/leaderboard';
import { LEADERBOARD_QUERY_KEY, useLeaderboard } from '../lib/leaderboardQuery';
import { useMyProfile } from '../lib/profileQuery';
import { countryFlag } from '../lib/country';
import { supabase } from '../lib/supabase';
import { tapFeedback } from '../lib/feedback';
import { colors, fontFamily, radius, spacing, type } from '../theme/colors';
import type { LeaderboardScreenProps } from '../navigation/TabNavigator';

const WINDOWS: { key: LeaderboardWindow; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'all_time', label: 'All Time' },
];

const SCOPES: { key: LeaderboardScope; label: string }[] = [
  { key: 'global', label: 'Global' },
  { key: 'country', label: 'Country' },
];

const RESET_NOTE: Partial<Record<LeaderboardWindow, string>> = {
  today: 'Resets daily at 12:00 AM PST',
  week: 'Resets weekly on Sunday 12:00 AM PST',
};

function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={20} height={16} />
      <Skeleton width={26} height={26} cornerRadius={radius.lg} />
      <Skeleton width="40%" height={16} style={{ flex: 1 }} />
      <Skeleton width={50} height={16} />
    </View>
  );
}

export function LeaderboardScreen({ navigation }: LeaderboardScreenProps) {
  const queryClient = useQueryClient();
  const [window, setWindow] = useState<LeaderboardWindow>('today');
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [beatBanner, setBeatBanner] = useState(false);

  const { data: profile } = useMyProfile();
  const { data, isPending, isFetching, refetch } = useLeaderboard(window, scope);
  const entries = data?.entries ?? [];
  const myRank = data?.myRank ?? null;
  const myUserId = data?.myUserId ?? null;
  const isGuest = data?.isGuest ?? true;
  const loading = isPending;

  // Country scope needs a country on the caller's own profile to filter
  // against (see get_leaderboard's p_country_only) - a guest, or a
  // signed-in account from before this existed whose country hasn't
  // backfilled yet, has neither. Falls back to global rather than showing
  // an empty/nonsensical result.
  const countryAvailable = !isGuest && !!profile?.country;
  useEffect(() => {
    if (scope === 'country' && !countryAvailable) setScope('global');
  }, [scope, countryAvailable]);

  const myRankRef = useRef<MyRank | null>(null);
  myRankRef.current = myRank;

  // Live leaderboard movement (CLAUDE.md Phase 5): a database trigger
  // broadcasts on every new run insert (see the `leaderboard` Realtime
  // topic), since Postgres Changes on public.runs would be filtered down to
  // only the subscriber's own rows by its RLS policy. The broadcast is just
  // a "something changed" ping - invalidate rather than trust a
  // client-reconstructed view. Invalidating the whole leaderboard key (not
  // just the current window) keeps other cached windows correctly marked
  // stale too, so switching tabs later doesn't show a fresher-than-reality
  // cached result.
  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel = supabase
        .channel('leaderboard', { config: { private: true } })
        .on('broadcast', { event: 'INSERT' }, (message: any) => {
          queryClient.invalidateQueries({ queryKey: [LEADERBOARD_QUERY_KEY] });

          const newScore = Number(message?.payload?.record?.score);
          if (
            !Number.isNaN(newScore) &&
            myRankRef.current &&
            newScore > myRankRef.current.score
          ) {
            setBeatBanner(true);
          }
        })
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!beatBanner) return;
    const timer = setTimeout(() => setBeatBanner(false), 4000);
    return () => clearTimeout(timer);
  }, [beatBanner]);

  const handleSelectWindow = (w: LeaderboardWindow) => {
    tapFeedback();
    setWindow(w);
  };

  const handleSelectScope = (s: LeaderboardScope) => {
    if (s === 'country' && !countryAvailable) return;
    tapFeedback();
    setScope(s);
  };

  const handleSignIn = () => {
    tapFeedback();
    navigation.navigate('Account');
  };

  const amInTopList = myUserId !== null && entries.some((e) => e.userId === myUserId);

  return (
    <View style={styles.container}>
      <Header title="Leaderboard" divider />

      <View style={styles.body}>
        {beatBanner && (
          <View style={styles.beatBanner}>
            <Text style={styles.beatBannerText}>SOMEONE JUST BEAT YOUR SCORE</Text>
          </View>
        )}

        {!loading && isGuest && (
          <View style={styles.signInBanner}>
            <SignInBanner message="Sign in to appear on the leaderboard." onPress={handleSignIn} />
          </View>
        )}

        <View style={styles.scopeRow}>
          {SCOPES.map((s) => {
            const disabled = s.key === 'country' && !countryAvailable;
            return (
              <Pressable
                key={s.key}
                style={[
                  styles.scopePill,
                  scope === s.key && styles.scopePillActive,
                  disabled && styles.scopePillDisabled,
                ]}
                onPress={() => handleSelectScope(s.key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={s.label}
              >
                {s.key === 'country' && profile?.country && (
                  <Text style={styles.scopeFlag}>{countryFlag(profile.country)}</Text>
                )}
                <Text style={[styles.scopeText, scope === s.key && styles.scopeTextActive]}>
                  {s.label.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.tabRow}>
          {WINDOWS.map((w, i) => (
            <Pressable
              key={w.key}
              style={[
                styles.tab,
                i < WINDOWS.length - 1 && styles.tabDivider,
                window === w.key && styles.tabActive,
              ]}
              onPress={() => handleSelectWindow(w.key)}
              accessibilityRole="button"
              accessibilityLabel={w.label}
            >
              <Text style={[styles.tabText, window === w.key && styles.tabTextActive]}>
                {w.label.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {RESET_NOTE[window] && (
          <View style={styles.resetNote}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textTertiary} />
            <Text style={styles.resetNoteText}>{RESET_NOTE[window]}</Text>
          </View>
        )}

        {loading ? (
          <View>
            {Array.from({ length: 8 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>NO RUNS YET - BE THE FIRST</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.userId}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isFetching && !isPending}
                onRefresh={refetch}
                tintColor={colors.accentGreen}
              />
            }
            renderItem={({ item }) => (
              <View style={[styles.row, item.userId === myUserId && styles.rowMe]}>
                <Text style={styles.rank}>{String(item.rank).padStart(2, '0')}</Text>
                <Avatar id={item.avatarId} size={26} />
                <View style={styles.usernameRow}>
                  {scope === 'global' && item.country && (
                    <Text style={styles.rowFlag}>{countryFlag(item.country)}</Text>
                  )}
                  <Text
                    style={styles.username}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {item.username ?? 'GUEST'}
                  </Text>
                  {item.isDev && <DevBadge size={12} />}
                </View>
                <Text style={[styles.score, item.userId === myUserId && styles.scoreMe]}>
                  {item.score.toFixed(2)}
                </Text>
              </View>
            )}
          />
        )}

        {!loading && myRank && !amInTopList && (
          <View style={styles.myRankFooter}>
            <Text style={styles.myRankText}>
              YOUR RANK  #{myRank.rank} / {myRank.total}  {myRank.score.toFixed(2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  beatBanner: {
    borderWidth: 1,
    borderColor: colors.accentAmber,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  beatBannerText: {
    color: colors.accentAmber,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInBanner: {
    marginBottom: spacing.md,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  scopePillActive: {
    borderColor: colors.accentTeal,
  },
  scopePillDisabled: {
    opacity: 0.4,
  },
  scopeFlag: {
    fontSize: 12,
  },
  scopeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scopeTextActive: {
    color: colors.accentTeal,
  },
  tabRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabDivider: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accentGreen,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: colors.accentGreen,
  },
  resetNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  resetNoteText: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: type.caption,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowMe: {
    backgroundColor: colors.surface,
  },
  rank: {
    color: colors.accentAmber,
    fontFamily: fontFamily.mono,
    fontSize: type.caption,
    width: 20,
  },
  usernameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rowFlag: {
    fontSize: 12,
  },
  // adjustsFontSizeToFit is the actual guarantee against ellipsis - the
  // tighter rank/avatar/gap sizing above buys back room so it rarely has to
  // shrink at all for the common case (today's usernames are a fixed 14
  // chars), but a future editable/longer username still won't truncate.
  username: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontSize: type.body,
    fontWeight: '600',
  },
  score: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoSemiBold,
    fontSize: type.body,
  },
  scoreMe: {
    color: colors.accentGreen,
  },
  myRankFooter: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  myRankText: {
    color: colors.textSecondary,
    fontFamily: fontFamily.mono,
    fontSize: type.caption,
    textAlign: 'center',
  },
});

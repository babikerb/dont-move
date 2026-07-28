import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { Skeleton } from '../components/Skeleton';
import { useMyRuns } from '../lib/runsQuery';
import { tapFeedback } from '../lib/feedback';
import { colors, fontFamily, spacing, type } from '../theme/colors';

function RowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width="45%" height={14} style={{ flex: 1 }} />
      <Skeleton width={28} height={14} />
      <Skeleton width={64} height={16} />
    </View>
  );
}

type Props = NativeStackScreenProps<RootStackParamList, 'RunHistory'>;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${date.toUpperCase()}  ${time}`;
}

export function RunHistoryScreen({ navigation }: Props) {
  const { data, isPending } = useMyRuns();
  const runs = data ?? [];

  const handleClose = () => {
    tapFeedback();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Header title="Run History" action={{ label: 'Close', onPress: handleClose }} divider />

      {isPending ? (
        <View style={styles.list}>
          {Array.from({ length: 10 }).map((_, i) => (
            <RowSkeleton key={i} />
          ))}
        </View>
      ) : runs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>NO RUNS YET</Text>
        </View>
      ) : (
        <FlatList
          data={runs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.timestamp}>{formatDateTime(item.createdAt)}</Text>
              <Text style={styles.duration}>{item.duration}S</Text>
              <Text style={styles.score}>{item.score.toFixed(2)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timestamp: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fontFamily.mono,
    fontSize: type.caption,
  },
  duration: {
    color: colors.accentTeal,
    fontFamily: fontFamily.mono,
    fontSize: type.caption,
  },
  score: {
    color: colors.textPrimary,
    fontFamily: fontFamily.monoSemiBold,
    fontSize: type.body,
    minWidth: 64,
    textAlign: 'right',
  },
});

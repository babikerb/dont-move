import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { Avatar } from '../components/Avatar';
import { AVATAR_IDS, SECRET_AVATARS } from '../lib/avatars';
import { Profile, updateMyAvatar } from '../lib/profile';
import { PROFILE_QUERY_KEY, useMyProfile } from '../lib/profileQuery';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'AvatarPicker'>;

export function AvatarPickerScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [initialAvatarId, setInitialAvatarId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('default');
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  // Seed local selection once, the first time real profile data arrives -
  // a later cache update (e.g. redeeming a code) shouldn't reset what the
  // player has already picked in this session.
  useEffect(() => {
    if (profile && initialAvatarId === null) {
      setInitialAvatarId(profile.avatarId);
      setSelectedId(profile.avatarId);
    }
  }, [profile, initialAvatarId]);

  // Save only on the way out, not on every tap - selecting is just local
  // browsing until you leave the screen.
  useEffect(() => {
    return () => {
      if (initialAvatarId !== null && selectedIdRef.current !== initialAvatarId) {
        updateMyAvatar(selectedIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAvatarId]);

  const handleSelect = (id: string) => {
    tapFeedback();
    setSelectedId(id);
    // Optimistic: reflected in the tab bar and Profile tab immediately,
    // before the eventual save-on-exit write even happens.
    queryClient.setQueryData(PROFILE_QUERY_KEY, (old: Profile | null | undefined) =>
      old ? { ...old, avatarId: id } : old
    );
  };

  const handleDone = () => {
    tapFeedback();
    navigation.goBack();
  };

  const handleRedeem = () => {
    tapFeedback();
    navigation.navigate('RedeemCode');
  };

  const unlockedIds = profile?.unlockedAvatarIds ?? [];
  const unlockedSecrets = SECRET_AVATARS.filter((a) => unlockedIds.includes(a.id));
  const options = [...AVATAR_IDS, ...unlockedSecrets.map((a) => a.id)];

  const GRID_COLUMNS = 4;

  return (
    <View style={styles.container}>
      <Header title="Choose Avatar" action={{ label: 'Done', onPress: handleDone }} divider />

      <FlatList
        data={options}
        keyExtractor={(id) => id}
        numColumns={GRID_COLUMNS}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: id }) => (
          <Pressable
            onPress={() => handleSelect(id)}
            style={[styles.option, id === selectedId && styles.optionSelected]}
            accessibilityRole="button"
            accessibilityLabel={`Avatar ${id}`}
          >
            <Avatar id={id} size={56} />
          </Pressable>
        )}
        ListFooterComponent={
          <Pressable onPress={handleRedeem} accessibilityRole="button" style={styles.redeemRow}>
            <Text style={styles.redeemText}>HAVE A CODE?</Text>
          </Pressable>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grid: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  gridRow: {
    gap: spacing.md,
  },
  option: {
    // flex: 1 (rather than a manual percentage width) lets the row divide
    // its own actual available width evenly across every column, gap
    // included - the previous 22% + space-between math didn't account for
    // gaps the same way, so the rendered circle and its slot could drift
    // out of sync and clip on one edge.
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: radius.lg,
  },
  optionSelected: {
    borderColor: colors.accentGreen,
  },
  redeemRow: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  redeemText: {
    color: colors.accentTeal,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

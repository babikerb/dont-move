import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Profile, redeemAvatarCode } from '../lib/profile';
import { PROFILE_QUERY_KEY } from '../lib/profileQuery';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemCode'>;

export function RedeemCodeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'invalid'>('idle');
  const [unlockedId, setUnlockedId] = useState<string | null>(null);

  const handleClose = () => {
    tapFeedback();
    navigation.goBack();
  };

  const handleSubmit = async () => {
    if (!code.trim() || status === 'checking') return;
    tapFeedback();
    setStatus('checking');

    const result = await redeemAvatarCode(code);
    if (!result.ok) {
      setStatus('invalid');
      return;
    }

    // So the avatar picker (still mounted underneath) shows it as available
    // the instant we go back, without waiting on a refetch.
    queryClient.setQueryData(PROFILE_QUERY_KEY, (old: Profile | null | undefined) =>
      old && !old.unlockedAvatarIds.includes(result.avatarId)
        ? { ...old, unlockedAvatarIds: [...old.unlockedAvatarIds, result.avatarId] }
        : old
    );

    hapticPersonalBest();
    setUnlockedId(result.avatarId);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <Header title="Redeem Code" action={{ label: 'Close', onPress: handleClose }} divider />

      {unlockedId ? (
        <View style={styles.center}>
          <Avatar id={unlockedId} size={88} />
          <Text style={styles.unlockedText}>AVATAR UNLOCKED</Text>
          <Button label="Done" onPress={handleClose} style={styles.actionButton} />
        </View>
      ) : (
        <View style={styles.center}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => {
              setCode(text);
              if (status === 'invalid') setStatus('idle');
            }}
            placeholder="ENTER CODE"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Code"
          />
          {status === 'invalid' && <Text style={styles.errorText}>INVALID CODE</Text>}
          <Button
            label={status === 'checking' ? 'Checking...' : 'Redeem'}
            onPress={handleSubmit}
            disabled={!code.trim() || status === 'checking'}
            style={styles.actionButton}
          />
        </View>
      )}
    </KeyboardAvoidingView>
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: type.heading,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorText: {
    color: colors.accentRed,
    fontSize: type.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  unlockedText: {
    color: colors.accentGreen,
    fontSize: type.body,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
});

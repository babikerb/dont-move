import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Avatar } from '../components/Avatar';
import { Profile, redeemAvatarCode } from '../lib/profile';
import { PROFILE_QUERY_KEY } from '../lib/profileQuery';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing } from '../theme/colors';

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
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>Redeem Code</Text>
        <Pressable onPress={handleClose} hitSlop={16} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      </View>

      {unlockedId ? (
        <View style={styles.center}>
          <Avatar id={unlockedId} size={88} />
          <Text style={styles.unlockedText}>Avatar unlocked</Text>
          <Pressable
            style={styles.doneButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
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
            placeholder="Enter code"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            accessibilityLabel="Code"
          />
          {status === 'invalid' && <Text style={styles.errorText}>Invalid code</Text>}
          <Pressable
            style={[styles.submitButton, !code.trim() && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!code.trim() || status === 'checking'}
            accessibilityRole="button"
            accessibilityLabel="Redeem"
          >
            <Text style={styles.submitButtonText}>
              {status === 'checking' ? 'Checking...' : 'Redeem'}
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeLabel: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  input: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  unlockedText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  doneButton: {
    marginTop: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  doneButtonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: '700',
  },
});

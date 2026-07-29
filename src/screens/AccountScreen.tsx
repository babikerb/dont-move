import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { GoogleIcon } from '../components/GoogleIcon';
import { AccountInfo, deleteMyAccount, fetchAccountInfo, signOutToGuest } from '../lib/supabase';
import { isAppleSignInAvailable, signInWithApple } from '../lib/appleAuth';
import { signInWithGoogle } from '../lib/googleAuth';
import { getDeviceCountryCode } from '../lib/country';
import { setMyCountryIfUnset } from '../lib/profile';
import { clearMyPushTokens, registerPushToken } from '../lib/notifications';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

function formatProvider(provider: string | null): string {
  if (!provider || provider === 'anonymous') return 'GUEST';
  return provider.toUpperCase();
}

const BENEFITS = ['Appear on the leaderboard', 'Sync progress across devices'];

export function AccountScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([fetchAccountInfo(), isAppleSignInAvailable()]).then(([acc, apple]) => {
      setAccount(acc);
      setAppleAvailable(apple);

      // Backfills country for accounts that signed in before this existed,
      // and is a no-op otherwise since setMyCountryIfUnset only writes when
      // the column is still null. Same idea for the push token - registers
      // it here too (not just right after sign-in below) so a device that
      // granted notification permission as a guest, then signs in later,
      // still ends up with a token on file.
      if (!acc.isAnonymous) {
        const code = getDeviceCountryCode();
        if (code) setMyCountryIfUnset(code);
        registerPushToken();
      }
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleClose = () => {
    tapFeedback();
    navigation.goBack();
  };

  const invalidateEverything = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['myStats'] });
  };

  const handleAppleSignIn = async () => {
    if (busy) return;
    tapFeedback();
    setBusy(true);
    const result = await signInWithApple();
    setBusy(false);

    if (result.ok) {
      hapticPersonalBest();
      invalidateEverything();
      refresh();
    } else if (result.reason === 'error') {
      Alert.alert('Sign in failed', 'Something went wrong. Try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    if (busy) return;
    tapFeedback();
    setBusy(true);
    const result = await signInWithGoogle();
    setBusy(false);

    if (result.ok) {
      hapticPersonalBest();
      invalidateEverything();
      refresh();
    } else if (result.reason === 'error') {
      Alert.alert('Sign in failed', 'Something went wrong. Try again.');
    }
  };

  const handleSignOut = () => {
    tapFeedback();
    Alert.alert('Sign out?', "You'll return to guest mode until you sign in again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          // Must run before signOutToGuest() - it deletes this device's
          // token rows for the current account, which relies on an
          // authenticated session (RLS) that no longer exists once signed
          // out.
          await clearMyPushTokens();
          await signOutToGuest();
          setBusy(false);
          invalidateEverything();
          refresh();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    if (busy) return;
    tapFeedback();
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your account, synced run history, avatar, stats, and leaderboard position. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const ok = await deleteMyAccount();
            setBusy(false);
            if (ok) {
              invalidateEverything();
              refresh();
            } else {
              Alert.alert('Delete failed', 'Something went wrong. Try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Account" action={{ label: 'Close', onPress: handleClose }} divider />

      <View style={styles.body}>
        {!account ? null : account.isAnonymous ? (
          <View style={styles.signInBlock}>
            <View style={styles.section}>
              {BENEFITS.map((benefit, i) => (
                <ListRow key={benefit} label={benefit} border={i < BENEFITS.length - 1} />
              ))}
            </View>

            {appleAvailable && Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
                cornerRadius={radius.md}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.googleButtonPressed,
                busy && styles.googleButtonDisabled,
              ]}
              onPress={handleGoogleSignIn}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <GoogleIcon size={18} />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.accountBlock}>
            <View style={styles.section}>
              <ListRow label="EMAIL" value={account.email ?? '-'} />
              <ListRow label="SIGNED IN WITH" value={formatProvider(account.provider)} border={false} />
            </View>

            <Button label="Sign Out" onPress={handleSignOut} variant="danger" disabled={busy} />

            <Pressable
              onPress={handleDeleteAccount}
              disabled={busy}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Delete Account"
            >
              <Text style={styles.deleteText}>Delete Account</Text>
            </Pressable>
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
    paddingTop: spacing.lg,
  },
  signInBlock: {
    gap: spacing.md,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  // Matches Google's standard "neutral/light" branded button spec: white
  // fill, #747775 border, #1F1F1F text - same reasoning as using Apple's
  // official button component for the Apple button above.
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#747775',
    borderRadius: radius.md,
  },
  googleButtonPressed: {
    opacity: 0.85,
  },
  googleButtonDisabled: {
    opacity: 0.5,
  },
  googleButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    fontWeight: '600',
  },
  accountBlock: {
    gap: spacing.xl,
  },
  deleteText: {
    color: colors.accentRed,
    fontSize: type.caption,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
});

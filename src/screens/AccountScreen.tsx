import React, { useCallback, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { Button } from '../components/Button';
import { ListRow } from '../components/ListRow';
import { AccountInfo, fetchAccountInfo, signOutToGuest } from '../lib/supabase';
import { isAppleSignInAvailable, signInWithApple } from '../lib/appleAuth';
import { hapticPersonalBest } from '../lib/haptics';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Account'>;

function formatProvider(provider: string | null): string {
  if (!provider || provider === 'anonymous') return 'GUEST';
  return provider.toUpperCase();
}

export function AccountScreen({ navigation }: Props) {
  const queryClient = useQueryClient();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    Promise.all([fetchAccountInfo(), isAppleSignInAvailable()]).then(([acc, apple]) => {
      setAccount(acc);
      setAppleAvailable(apple);
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

  const handleGoogleSignIn = () => {
    tapFeedback();
    Alert.alert('Sign in with Google', 'Coming soon.');
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
          await signOutToGuest();
          setBusy(false);
          invalidateEverything();
          refresh();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Account" action={{ label: 'Close', onPress: handleClose }} divider />

      <View style={styles.body}>
        {!account ? null : account.isAnonymous ? (
          <View style={styles.signInBlock}>
            <Text style={styles.prompt}>Sign in to save your progress across devices.</Text>

            {appleAvailable && Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={radius.md}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            <Button label="Sign in with Google" onPress={handleGoogleSignIn} variant="secondary" />
          </View>
        ) : (
          <View style={styles.accountBlock}>
            <View style={styles.section}>
              <ListRow label="EMAIL" value={account.email ?? '-'} />
              <ListRow label="SIGNED IN WITH" value={formatProvider(account.provider)} border={false} />
            </View>

            <Button label="Sign Out" onPress={handleSignOut} variant="danger" disabled={busy} />
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
  prompt: {
    color: colors.textSecondary,
    fontSize: type.body,
    marginBottom: spacing.xs,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  accountBlock: {
    gap: spacing.xl,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
});

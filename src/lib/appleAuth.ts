import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { hasValidSession, supabase } from './supabase';
import { migrateLocalHistoryToAccount } from './accountMigration';

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export type AppleSignInResult = { ok: true } | { ok: false; reason: 'cancelled' | 'error' };

// Guest play no longer has any session at all (no anonymous account is
// created), so the common case now is signing in from a clean slate:
// signInWithIdToken finds-or-creates the permanent account matching this
// Apple identity directly.
//
// linkIdentity only matters for the rarer case where a session already
// exists (e.g. re-triggering sign-in, or a future multi-provider flow) -
// it upgrades that session in place rather than creating a second account.
// If the identity turns out to already belong to a different account (this
// device's session isn't the one it's tied to), linkIdentity correctly
// refuses ("already linked to another user"), so we fall back to
// signInWithIdToken to sign straight into that existing account instead.
export async function signInWithApple(): Promise<AppleSignInResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { ok: false, reason: 'error' };
    }

    const hasExistingSession = await hasValidSession();

    if (hasExistingSession) {
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (linkError && !linkError.message.toLowerCase().includes('already linked')) {
        console.warn('Apple linkIdentity failed:', linkError.message);
        return { ok: false, reason: 'error' };
      }

      if (linkError) {
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (signInError) {
          console.warn('Apple signInWithIdToken failed:', signInError.message);
          return { ok: false, reason: 'error' };
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) {
        console.warn('Apple signInWithIdToken failed:', error.message);
        return { ok: false, reason: 'error' };
      }
    }

    await migrateLocalHistoryToAccount();
    return { ok: true };
  } catch (err: any) {
    if (err?.code === 'ERR_REQUEST_CANCELED') {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('Apple sign-in failed:', err);
    return { ok: false, reason: 'error' };
  }
}

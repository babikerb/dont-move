import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { migrateLocalHistoryToAccount } from './accountMigration';

// Supabase validates the Google ID token's audience against the Web Client
// ID registered in its own Google provider settings, not the iOS one - the
// iOS client only drives the native sign-in UI/URL scheme (see app.json's
// @react-native-google-signin/google-signin plugin config). Configuring
// with just the iOS client would produce a token Supabase rejects as an
// audience mismatch.
const WEB_CLIENT_ID = '800321101197-0dbgd7ehjaqjc1a1ochpo3o291f2jpcs.apps.googleusercontent.com';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  configured = true;
}

export type GoogleSignInResult = { ok: true } | { ok: false; reason: 'cancelled' | 'error' };

// Mirrors appleAuth.ts's linkIdentity/signInWithIdToken dual path: the
// common case (no session yet, guest play) signs straight into the
// find-or-create account for this Google identity; the rarer
// already-signed-in case links this identity to the current session,
// falling back to signInWithIdToken if it turns out to already belong to a
// different account.
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  ensureConfigured();

  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();

    if (!isSuccessResponse(response)) {
      return { ok: false, reason: 'cancelled' };
    }

    const idToken = response.data.idToken;
    if (!idToken) {
      return { ok: false, reason: 'error' };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const hasExistingSession = !!sessionData.session;

    if (hasExistingSession) {
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider: 'google',
        token: idToken,
      });

      if (linkError && !linkError.message.toLowerCase().includes('already linked')) {
        console.warn('Google linkIdentity failed:', linkError.message);
        return { ok: false, reason: 'error' };
      }

      if (linkError) {
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (signInError) {
          console.warn('Google signInWithIdToken failed:', signInError.message);
          return { ok: false, reason: 'error' };
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) {
        console.warn('Google signInWithIdToken failed:', error.message);
        return { ok: false, reason: 'error' };
      }
    }

    await migrateLocalHistoryToAccount();
    return { ok: true };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.IN_PROGRESS) {
      return { ok: false, reason: 'cancelled' };
    }
    console.warn('Google sign-in failed:', err);
    return { ok: false, reason: 'error' };
  }
}

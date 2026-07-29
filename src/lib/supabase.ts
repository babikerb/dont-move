import { AppState, Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

// No account is created until the player explicitly signs in - guest play
// is local-only (AsyncStorage), no Supabase user, nothing synced. Every
// helper below treats "no session" the same as "guest": reads return
// null/empty, writes no-op, all without creating anything server-side.
export async function isAnonymousSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.is_anonymous ?? true;
}

export interface AccountInfo {
  isAnonymous: boolean;
  email: string | null;
  provider: string | null;
}

export async function fetchAccountInfo(): Promise<AccountInfo> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return {
    isAnonymous: user?.is_anonymous ?? true,
    email: user?.email ?? null,
    provider: (user?.app_metadata?.provider as string | undefined) ?? null,
  };
}

// Just ends the session - no replacement account gets created. The app
// falls back to local-only guest state, same as before ever signing in.
export async function signOutToGuest(): Promise<void> {
  await supabase.auth.signOut();
}

// getSession() only reads the locally cached token, so if the underlying
// account was deleted without going through this app's own signOut (e.g.
// deleted directly via the Supabase dashboard/admin API), the device is
// left holding a session that still looks valid locally but is dead
// server-side. getUser() round-trips to the Auth server and actually
// revalidates the JWT's subject, so a dangling session is caught and
// cleared here - appleAuth.ts/googleAuth.ts both call this before deciding
// whether to link the new identity to "the current session" or sign
// straight into the find-or-create account, and a false positive there
// surfaces as a linkIdentity call that fails with a real (non-"already
// linked") error, i.e. a mysterious "Sign in failed".
export async function hasValidSession(): Promise<boolean> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    await supabase.auth.signOut();
    return false;
  }
  return !!data.user;
}

// Calls the delete-account Edge Function (service_role only - the client's
// publishable key can never delete an auth.users row directly). The
// function always deletes the caller's own id, derived server-side from
// their verified JWT. public.users and public.runs cascade-delete via their
// foreign keys, so there's nothing else to clean up client-side beyond
// ending the local session.
export async function deleteMyAccount(): Promise<boolean> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) return false;

  await supabase.auth.signOut();
  return true;
}

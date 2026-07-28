import { REDEEM_CODES } from './avatars';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string | null;
  avatarId: string;
  unlockedAvatarIds: string[];
  isDev: boolean;
  country: string | null;
}

async function getMyUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function fetchMyProfile(): Promise<Profile | null> {
  const userId = await getMyUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_id, unlocked_avatar_ids, is_dev, country')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    avatarId: data.avatar_id,
    unlockedAvatarIds: data.unlocked_avatar_ids ?? [],
    isDev: data.is_dev ?? false,
    country: data.country,
  };
}

export async function updateMyAvatar(avatarId: string): Promise<boolean> {
  const userId = await getMyUserId();
  if (!userId) return false;

  const { error } = await supabase.from('users').update({ avatar_id: avatarId }).eq('id', userId);
  return !error;
}

// Set once, right after sign-in - never overwritten afterward, so a later
// trip abroad doesn't silently relabel someone's leaderboard country.
export async function setMyCountryIfUnset(countryCode: string): Promise<void> {
  const userId = await getMyUserId();
  if (!userId) return;

  await supabase.from('users').update({ country: countryCode }).eq('id', userId).is('country', null);
}

export type RedeemResult = { ok: true; avatarId: string } | { ok: false };

// The code table is a plain client-side constant (matches callit's
// approach) - this is a cosmetic-only easter egg, not access control, so
// there's no need for a server-side secret.
export async function redeemAvatarCode(rawCode: string): Promise<RedeemResult> {
  const code = rawCode.trim().toUpperCase();
  const avatarId = REDEEM_CODES[code];
  if (!avatarId) return { ok: false };

  const userId = await getMyUserId();
  if (!userId) return { ok: false };

  const { data, error } = await supabase
    .from('users')
    .select('unlocked_avatar_ids')
    .eq('id', userId)
    .single();
  if (error || !data) return { ok: false };

  const current: string[] = data.unlocked_avatar_ids ?? [];
  if (!current.includes(avatarId)) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ unlocked_avatar_ids: [...current, avatarId] })
      .eq('id', userId);
    if (updateError) return { ok: false };
  }

  return { ok: true, avatarId };
}

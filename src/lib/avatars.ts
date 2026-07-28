export interface AvatarPreset {
  id: string;
  options?: Record<string, unknown>;
}

// Assigned automatically at account creation, before a player ever visits
// the Profile tab. DiceBear has no gender concept by design (a seed's look
// is just a pseudo-random hash, not tied to any name), so a "neutral"
// default means explicitly pinning the features that read as gendered -
// short plain hair, no facial hair, plain neutral clothing - rather than
// leaving them to chance.
export const DEFAULT_AVATAR_ID = 'default';

const DEFAULT_AVATAR_OPTIONS: Record<string, unknown> = {
  top: ['shortFlat'],
  facialHairProbability: 0,
  clothing: ['shirtCrewNeck'],
};

// DiceBear "avataaars" seeds - cartoon avatars rendered entirely on-device
// (see components/Avatar.tsx), so this works offline and needs no Storage
// bucket. The id is what's stored on the user's profile; any device renders
// the same avatar from it. Presented as choices in the Profile tab.
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'Felix' },
  { id: 'Aneka' },
  { id: 'Jasper' },
  { id: 'Luna' },
  { id: 'Milo' },
  { id: 'Nova' },
  { id: 'Pip' },
  { id: 'Ruby' },
  { id: 'Theo' },
  { id: 'Zara' },
  { id: 'Bruno' },
  { id: 'Cleo' },
];

export const AVATAR_IDS: string[] = AVATAR_PRESETS.map((a) => a.id);

// Hidden avatars unlocked only by redeeming a code (RedeemCodeScreen), per
// callit's pattern. avataaars has no literal "durag" asset - closest
// available approximation is the plain `hat` top style recolored, over a
// dark skin tone.
export const SECRET_AVATARS: AvatarPreset[] = [
  {
    id: 'PurpleDurag',
    options: {
      // 'hat' renders as a floppy wide-brimmed hat, nothing like a durag.
      // 'turban' sits fitted to the head with no brim - much closer, even
      // though avataaars has no true durag (with its back knot/tail).
      top: ['turban'],
      hatColor: ['6D28FF'],
      skinColor: ['3c1c0a'],
      facialHairProbability: 0,
    },
  },
];

// Redeem code (uppercase) -> avatar id.
export const REDEEM_CODES: Record<string, string> = {
  BPD: 'PurpleDurag',
};

export const AVATAR_OPTIONS_BY_ID: Record<string, Record<string, unknown>> = {
  [DEFAULT_AVATAR_ID]: DEFAULT_AVATAR_OPTIONS,
  ...Object.fromEntries(
    [...AVATAR_PRESETS, ...SECRET_AVATARS].map((a) => [a.id, a.options ?? {}])
  ),
};

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
//
// Clothing is pinned rather than left to the seed's random hash: some
// clothing styles (e.g. narrow hoodie cuts) don't reach the bottom corners
// of the circular mask, leaving small gaps that show the background color
// through. shirtCrewNeck is the one confirmed to fill flush on every seed.
const PRESET_OPTIONS: Record<string, unknown> = { clothing: ['shirtCrewNeck'] };

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'Felix', options: PRESET_OPTIONS },
  { id: 'Aneka', options: PRESET_OPTIONS },
  { id: 'Jasper', options: PRESET_OPTIONS },
  { id: 'Luna', options: PRESET_OPTIONS },
  { id: 'Milo', options: PRESET_OPTIONS },
  { id: 'Nova', options: PRESET_OPTIONS },
  { id: 'Pip', options: PRESET_OPTIONS },
  { id: 'Ruby', options: PRESET_OPTIONS },
  { id: 'Theo', options: PRESET_OPTIONS },
  { id: 'Zara', options: PRESET_OPTIONS },
  { id: 'Bruno', options: PRESET_OPTIONS },
  { id: 'Cleo', options: PRESET_OPTIONS },
];

export const AVATAR_IDS: string[] = AVATAR_PRESETS.map((a) => a.id);

// Hidden avatars unlocked only by redeeming a code (RedeemCodeScreen), per
// callit's pattern.
export const SECRET_AVATARS: AvatarPreset[] = [
  {
    id: 'BlackBoyBald',
    options: {
      topProbability: 0,
      skinColor: ['3c1c0a'],
      facialHairProbability: 0,
      accessories: ['sunglasses'],
      accessoriesColor: ['000000'],
      accessoriesProbability: 100,
      eyebrows: ['defaultNatural'],
      mouth: ['tongue'],
      clothing: ['shirtCrewNeck'],
      clothesColor: ['ffffff'],
      // A bald head has no hair to absorb the extra height, so the bare
      // skull is tall enough to hit the circular mask's edge (flattening
      // the top of the circle). scale clears it; translateY nudges the
      // whole thing back down so the shoulders still sit flush against the
      // bottom instead of leaving a gap.
      scale: 92,
      translateY: 4,
    },
  },
];

// Redeem code (uppercase) -> avatar id.
export const REDEEM_CODES: Record<string, string> = {
  BBB: 'BlackBoyBald',
};

export const AVATAR_OPTIONS_BY_ID: Record<string, Record<string, unknown>> = {
  [DEFAULT_AVATAR_ID]: DEFAULT_AVATAR_OPTIONS,
  ...Object.fromEntries(
    [...AVATAR_PRESETS, ...SECRET_AVATARS].map((a) => [a.id, a.options ?? {}])
  ),
};

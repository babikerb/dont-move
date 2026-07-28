import React, { useMemo } from 'react';
import { View } from 'react-native';
import { avataaars } from '@dicebear/collection';
import { createAvatar } from '@dicebear/core';
import { SvgXml } from 'react-native-svg';
import { AVATAR_OPTIONS_BY_ID, DEFAULT_AVATAR_ID } from '../lib/avatars';

interface AvatarProps {
  id?: string | null;
  size?: number;
}

const cache = new Map<string, string>();

// Dark neutrals plus the app's own muted retro accents (no bright blue, no
// neon) - matches CLAUDE.md's tactical-instrument palette instead of
// callit's bright party colors. Red is left out; it reads as
// danger/rejection elsewhere in the app, not a neutral avatar backdrop.
const BACKGROUND_COLORS = ['1C1C1E', '2C2C2E', '7A9B6A', '5E8A8E', 'B8903F'];

function svgForSeed(seed: string): string {
  const cached = cache.get(seed);
  if (cached) return cached;

  const overrides = AVATAR_OPTIONS_BY_ID[seed] ?? {};
  const svg = createAvatar(avataaars, {
    seed,
    // Square canvas, no internal circular mask - DiceBear's own SVG <mask>
    // approach doesn't always render identically through react-native-svg
    // (subtle top clipping was visible on-device despite server-rendered
    // test PNGs looking correct). The circle is instead cut natively below,
    // which is guaranteed pixel-accurate.
    radius: 0,
    backgroundColor: BACKGROUND_COLORS,
    ...overrides,
  }).toString();

  cache.set(seed, svg);
  return svg;
}

export function Avatar({ id, size = 48 }: AvatarProps) {
  const seed = id || DEFAULT_AVATAR_ID;
  const svg = useMemo(() => svgForSeed(seed), [seed]);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <SvgXml xml={svg} width={size} height={size} />
    </View>
  );
}

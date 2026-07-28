import * as Localization from 'expo-localization';

// Device region, not GPS - reads the phone's OS locale setting rather than
// asking for a location permission the app has no other use for. Not a
// verified "where you actually are" signal (a US phone traveling abroad
// still reads US), but that's the same tradeoff every casual leaderboard
// app with a country filter makes, and it costs the user nothing to get.
export function getDeviceCountryCode(): string | null {
  const region = Localization.getLocales()[0]?.regionCode;
  return region ?? null;
}

// ISO 3166-1 alpha-2 -> flag emoji, via the regional indicator symbol
// unicode trick (each letter A-Z maps to U+1F1E6-U+1F1FF in order).
export function countryFlag(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = [...countryCode.toUpperCase()].map(
    (char) => 0x1f1e6 + (char.charCodeAt(0) - 65)
  );
  return String.fromCodePoint(...codePoints);
}

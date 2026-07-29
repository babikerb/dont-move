import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_KEY = '@pause/soundEnabled';
const HAPTICS_KEY = '@pause/hapticsEnabled';

// Read synchronously by haptics.ts and sound.ts on every trigger, so the
// toggle in Settings takes effect immediately without an AsyncStorage round
// trip on the hot path. loadSettings() populates this cache at app startup.
let soundEnabled = true;
let hapticsEnabled = true;

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function isHapticsEnabled(): boolean {
  return hapticsEnabled;
}

export async function loadSettings(): Promise<void> {
  const [storedSound, storedHaptics] = await Promise.all([
    AsyncStorage.getItem(SOUND_KEY),
    AsyncStorage.getItem(HAPTICS_KEY),
  ]);

  if (storedSound !== null) soundEnabled = storedSound === 'true';
  if (storedHaptics !== null) hapticsEnabled = storedHaptics === 'true';
}

export async function setSoundEnabled(value: boolean): Promise<void> {
  soundEnabled = value;
  await AsyncStorage.setItem(SOUND_KEY, String(value));
}

export async function setHapticsEnabled(value: boolean): Promise<void> {
  hapticsEnabled = value;
  await AsyncStorage.setItem(HAPTICS_KEY, String(value));
}

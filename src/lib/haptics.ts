import * as Haptics from 'expo-haptics';
import { isHapticsEnabled } from './settings';

export function hapticCountdownTick() {
  if (!isHapticsEnabled()) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticGo() {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function hapticButton() {
  if (!isHapticsEnabled()) return;
  Haptics.selectionAsync();
}

export async function hapticPersonalBest() {
  if (!isHapticsEnabled()) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export function hapticReleasedEarly() {
  if (!isHapticsEnabled()) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

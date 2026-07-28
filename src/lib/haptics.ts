import * as Haptics from 'expo-haptics';

export const hapticCountdownTick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

export const hapticGo = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

export const hapticButton = () => Haptics.selectionAsync();

export async function hapticPersonalBest() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const COME_BACK_REMINDER_ID = 'come-back-reminder';
const COME_BACK_DELAY_HOURS = 24;

// Requested once at launch (not contextually) - notifications and the
// scoring gameplay loop both depend on it being resolved up front rather
// than mid-session, so App.tsx calls this on startup. iOS/Android only ever
// show the OS prompt once anyway (a prior denial has to be reversed in
// system Settings), so this is a no-op after the first launch either way.
export async function requestNotificationPermissionOnLaunch(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }

  await scheduleComeBackReminder();
  await registerPushToken();
}

// A day-later local nudge for a player who hasn't opened the app since.
// Purely on-device (no server round trip), so it works for guests too, not
// just signed-in accounts. Rescheduled every time a run finishes so it
// always means "24 hours since you last played," not a stale one-shot from
// whenever the app was first installed.
export async function scheduleComeBackReminder(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  await Notifications.cancelScheduledNotificationAsync(COME_BACK_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: COME_BACK_REMINDER_ID,
    content: {
      title: 'Pause',
      body: 'Think you can still hold it steady? Come find out.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: COME_BACK_DELAY_HOURS * 60 * 60,
    },
  });
}

// Server-triggered pushes (someone beat you, leaderboard reset) only ever
// target signed-in accounts - runSync.ts already skips syncing guest runs
// entirely, so a guest's device would never be looked up regardless. Silent
// no-op on a simulator, which can't obtain a real push token.
export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.is_anonymous) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );

  await supabase.from('push_tokens').upsert({ user_id: user.id, token: token });
}

// Called on sign-out so a device that switches accounts doesn't leave a
// stale token pointing server-side pushes at an account no longer signed
// in on it.
export async function clearMyPushTokens(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return;

  await supabase.from('push_tokens').delete().eq('user_id', userId);
}

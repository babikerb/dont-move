import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadSettings } from './src/lib/settings';
import { configureAudio } from './src/lib/sound';
import { requestNotificationPermissionOnLaunch } from './src/lib/notifications';
import { initAnalytics, trackAppLaunched } from './src/lib/analytics';

// Keeps the native splash (icon.png, full-width, pure black bg - see
// app.json's expo-splash-screen config) on screen until fonts are ready,
// then fades it out rather than an abrupt cut straight to the app.
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 400, fade: true });

// Defaults matter here: without a staleTime, every mount (switching tabs,
// reopening a modal screen) refetches from Supabase even though profile/
// stats/leaderboard data rarely changes moment-to-moment. A minute of
// staleness is invisible to the player but cuts a large share of otherwise
// redundant reads; anything that needs to be instantly fresh (after
// sign-in/out, an avatar change, a new run) already calls
// invalidateQueries explicitly rather than relying on this window to pass.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    loadSettings();
    configureAudio();
    // No account is created at launch - guest play stays fully local until
    // the player explicitly signs in (CLAUDE.md's First Run Experience).
    // The notification permission prompt is the one deliberate exception to
    // "nothing at launch": asked immediately so it's resolved before it'd
    // otherwise interrupt gameplay later.
    requestNotificationPermissionOnLaunch();
    initAnalytics();
    trackAppLaunched();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Pure black, matching the splash screen exactly (not colors.background,
    // which is a hair lighter #0A0A0A) - the native splash fades out over
    // whatever's already rendered underneath, so any mismatch here would
    // show as a faint color step partway through that fade.
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

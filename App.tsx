import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
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
import { colors } from './src/theme/colors';

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
  }, []);

  if (!fontsLoaded) {
    // Near-black, matching the background - no visible flash while the
    // (usually sub-100ms, cached after first load) font load completes.
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
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

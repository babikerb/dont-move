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
import { ensureSession } from './src/lib/supabase';
import { colors } from './src/theme/colors';

const queryClient = new QueryClient();

export default function App() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    loadSettings();
    configureAudio();
    // Fire-and-forget: a missing/failed session should never block gameplay,
    // per CLAUDE.md's First Run Experience ("no login prompts during gameplay").
    ensureSession();
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

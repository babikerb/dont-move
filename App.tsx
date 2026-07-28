import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadSettings } from './src/lib/settings';
import { configureAudio } from './src/lib/sound';
import { ensureSession } from './src/lib/supabase';

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => {
    loadSettings();
    configureAudio();
    // Fire-and-forget: a missing/failed session should never block gameplay,
    // per CLAUDE.md's First Run Experience ("no login prompts during gameplay").
    ensureSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

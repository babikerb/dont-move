import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { loadSettings } from './src/lib/settings';
import { configureAudio } from './src/lib/sound';

export default function App() {
  useEffect(() => {
    loadSettings();
    configureAudio();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

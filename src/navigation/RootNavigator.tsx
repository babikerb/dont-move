import React, { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PlayScreen } from '../screens/PlayScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { AvatarPickerScreen } from '../screens/AvatarPickerScreen';
import { RedeemCodeScreen } from '../screens/RedeemCodeScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { RunHistoryScreen } from '../screens/RunHistoryScreen';
import { TabNavigator } from './TabNavigator';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Tabs: undefined;
  Play: undefined;
  Results: {
    score: number;
    movementScore: number;
    trace: number[];
    isPersonalBest: boolean;
    bestScore: number;
  };
  AvatarPicker: undefined;
  RedeemCode: undefined;
  Settings: undefined;
  RunHistory: undefined;
};

export type TabParamList = {
  Home: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    primary: colors.accentGreen,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.background,
  },
};

export function RootNavigator() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: reduceMotion ? 'none' : 'fade',
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Play" component={PlayScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="AvatarPicker" component={AvatarPickerScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RedeemCode" component={RedeemCodeScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RunHistory" component={RunHistoryScreen} options={{ presentation: 'modal' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

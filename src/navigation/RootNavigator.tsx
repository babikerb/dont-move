import React from 'react';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { CountdownScreen } from '../screens/CountdownScreen';
import { RunScreen } from '../screens/RunScreen';
import { ResultsScreen } from '../screens/ResultsScreen';
import { colors } from '../theme/colors';

export type RootStackParamList = {
  Home: undefined;
  Countdown: undefined;
  Run: undefined;
  Results: {
    score: number;
    movementScore: number;
    trace: number[];
    isPersonalBest: boolean;
    bestScore: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    primary: colors.accent,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.background,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Countdown" component={CountdownScreen} />
        <Stack.Screen name="Run" component={RunScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

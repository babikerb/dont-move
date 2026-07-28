import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar } from '../components/Avatar';
import { HomeScreen } from '../screens/HomeScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useMyProfile } from '../lib/profileQuery';
import { colors } from '../theme/colors';
import type { RootStackParamList, TabParamList } from './RootNavigator';

export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;
export type LeaderboardScreenProps = BottomTabScreenProps<TabParamList, 'Leaderboard'>;
export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

const Tab = createBottomTabNavigator<TabParamList>();

const ICONS: Record<'Home' | 'Leaderboard', keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Leaderboard: 'trophy',
};

function ProfileTabIcon({ color, size }: { color: string; size: number }) {
  const { data: profile, isPending } = useMyProfile();

  if (isPending) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surface,
        }}
      />
    );
  }

  return <Avatar id={profile?.avatarId} size={size} />;
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.divider,
        },
        tabBarIcon: ({ color, size }) =>
          route.name === 'Profile' ? (
            <ProfileTabIcon color={color} size={size} />
          ) : (
            <Ionicons name={ICONS[route.name as 'Home' | 'Leaderboard']} color={color} size={size} />
          ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

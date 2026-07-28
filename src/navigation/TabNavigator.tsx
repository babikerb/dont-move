import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../components/Avatar';
import { HomeScreen } from '../screens/HomeScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { useMyProfile } from '../lib/profileQuery';
import { tapFeedback } from '../lib/feedback';
import { colors, spacing, type } from '../theme/colors';
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
  Home: 'home-outline',
  Leaderboard: 'stats-chart-outline',
};

const LABELS: Record<keyof TabParamList, string> = {
  Home: 'HOME',
  Leaderboard: 'RANK',
  Profile: 'PROFILE',
};

function ProfileTabIcon({ active }: { active: boolean }) {
  const { data: profile, isPending } = useMyProfile();

  if (isPending) {
    return <View style={styles.avatarSkeleton} />;
  }

  return (
    <View style={[styles.avatarRing, active && styles.avatarRingActive]}>
      <Avatar id={profile?.avatarId} size={18} />
    </View>
  );
}

// Fully custom tab bar - fixed height, solid background, thin top border,
// edge-to-edge, no blur, no floating pill, no bounce. Meant to feel like a
// row of buttons on a piece of hardware, not a soft mobile-app tab bar.
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tintColor = isFocused ? colors.accentGreen : colors.textSecondary;

        const onPress = () => {
          tapFeedback();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={descriptors[route.key].options.title ?? route.name}
          >
            {route.name === 'Profile' ? (
              <ProfileTabIcon active={isFocused} />
            ) : (
              <Ionicons
                name={ICONS[route.name as 'Home' | 'Leaderboard']}
                size={20}
                color={tintColor}
              />
            )}
            <Text style={[styles.tabLabel, { color: tintColor }]}>
              {LABELS[route.name as keyof TabParamList]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  tabPressed: {
    opacity: 0.6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  avatarRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarRingActive: {
    borderColor: colors.accentGreen,
  },
  avatarSkeleton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
  },
});

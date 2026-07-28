import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Header } from '../components/Header';
import { ListRow } from '../components/ListRow';
import { isHapticsEnabled, isSoundEnabled, setHapticsEnabled, setSoundEnabled } from '../lib/settings';
import { isAnonymousSession } from '../lib/supabase';
import { tapFeedback } from '../lib/feedback';
import { colors, radius, spacing, type } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [hapticsOn, setHapticsOn] = useState(isHapticsEnabled());
  const [isAnonymous, setIsAnonymous] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      isAnonymousSession().then((anon) => {
        if (!cancelled) setIsAnonymous(anon);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleToggleSound = (value: boolean) => {
    setSoundOn(value);
    setSoundEnabled(value);
  };

  const handleToggleHaptics = (value: boolean) => {
    setHapticsOn(value);
    setHapticsEnabled(value);
  };

  const handleDone = () => {
    tapFeedback();
    navigation.goBack();
  };

  const handleStub = (label: string) => {
    tapFeedback();
    Alert.alert(label, 'Coming soon.');
  };

  const handleAccount = () => {
    tapFeedback();
    navigation.navigate('Account');
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" action={{ label: 'Done', onPress: handleDone }} divider />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ListRow
            label="SOUND"
            right={
              <Switch
                value={soundOn}
                onValueChange={handleToggleSound}
                trackColor={{ false: colors.switchTrackOff, true: colors.accentGreen }}
                thumbColor={colors.switchThumb}
                accessibilityLabel="Sound"
              />
            }
          />
          <ListRow
            label="HAPTICS"
            border={false}
            right={
              <Switch
                value={hapticsOn}
                onValueChange={handleToggleHaptics}
                trackColor={{ false: colors.switchTrackOff, true: colors.accentGreen }}
                thumbColor={colors.switchThumb}
                accessibilityLabel="Haptics"
              />
            }
          />
        </View>

        <View style={styles.section}>
          <ListRow label="PRIVACY" onPress={() => handleStub('Privacy')} />
          <ListRow
            label={isAnonymous ? 'SIGN IN' : 'ACCOUNT'}
            border={false}
            onPress={handleAccount}
            accessibilityLabel="Account"
          />
        </View>

        <View style={styles.aboutBlock}>
          <Text style={styles.aboutText}>Don't Move. Hold your phone as still as possible.</Text>
          <Text style={styles.versionText}>VERSION 0.1.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  section: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  aboutBlock: {
    paddingHorizontal: spacing.xs,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: type.caption,
    marginBottom: spacing.xs,
  },
  versionText: {
    color: colors.textTertiary,
    fontSize: type.caption,
    letterSpacing: 0.5,
  },
});

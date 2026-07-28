import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { hapticCountdownTick, hapticGo } from '../lib/haptics';
import { configureAudio, playSound } from '../lib/sound';
import { colors } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Countdown'>;

const COUNT_START = 3;

export function CountdownScreen({ navigation }: Props) {
  const [count, setCount] = useState(COUNT_START);

  useEffect(() => {
    configureAudio();
  }, []);

  useEffect(() => {
    if (count > 0) {
      hapticCountdownTick();
      playSound('tick');
      const timer = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }

    hapticGo();
    playSound('go');
    const timer = setTimeout(() => navigation.replace('Run'), 350);
    return () => clearTimeout(timer);
  }, [count, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.countText}>{count > 0 ? count : 'GO'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: colors.accent,
    fontSize: 96,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

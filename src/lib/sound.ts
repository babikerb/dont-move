import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const soundAssets = {
  tick: require('../../assets/sounds/tick.wav'),
  go: require('../../assets/sounds/go.wav'),
  pb: require('../../assets/sounds/pb.wav'),
  click: require('../../assets/sounds/click.wav'),
} as const;

type SoundName = keyof typeof soundAssets;

const players = new Map<SoundName, AudioPlayer>();

export async function configureAudio(): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
  });
}

function getPlayer(name: SoundName): AudioPlayer {
  let player = players.get(name);
  if (!player) {
    player = createAudioPlayer(soundAssets[name]);
    players.set(name, player);
  }
  return player;
}

export function playSound(name: SoundName): void {
  try {
    const player = getPlayer(name);
    player.seekTo(0);
    player.play();
  } catch {
    // Silent-mode / device audio-session edge cases shouldn't block gameplay.
  }
}

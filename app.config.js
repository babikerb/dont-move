// A dynamic config instead of a plain app.json for one reason: Expo's own
// base Info.plist template (@expo/config-plugins' withIosBaseMods) sets
// NSAllowsArbitraryLoads: true unconditionally, on every unmodified Expo
// project - a blanket App Transport Security bypass allowing insecure HTTP
// to any domain, not just the "preview" it's meant to be. This app only
// ever talks HTTPS (Supabase, Apple, Google, Aptabase, Expo's push
// service), so there's no legitimate reason to ship that in a real
// App Store build. It's still needed for local dev, though: the dev
// client fetches the JS bundle from Metro over plain HTTP, often over a
// LAN IP rather than literally "localhost". EAS Build sets
// EAS_BUILD_PROFILE during cloud builds (undefined for a bare local
// `expo start`), so this only tightens ATS for the "preview" and
// "production" eas.json profiles - actual local/dev-client builds are
// completely unaffected.
const isDistributionBuild = ['preview', 'production'].includes(process.env.EAS_BUILD_PROFILE);

module.exports = {
  expo: {
    name: 'Pause',
    slug: 'dont-move',
    scheme: 'pause',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    backgroundColor: '#000000',
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.bbabiker.dontmove',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        ...(isDistributionBuild
          ? {
              NSAppTransportSecurity: {
                NSAllowsArbitraryLoads: false,
              },
            }
          : {}),
      },
    },
    android: {
      package: 'com.bbabiker.dontmove',
      adaptiveIcon: {
        backgroundColor: '#000000',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      permissions: ['android.permission.RECORD_AUDIO', 'android.permission.MODIFY_AUDIO_SETTINGS'],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-audio',
        {
          microphonePermission: false,
        },
      ],
      'expo-asset',
      'expo-font',
      'expo-apple-authentication',
      'expo-localization',
      [
        'expo-sensors',
        {
          motionPermission: "Pause uses motion data to score how still you're holding your phone.",
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#7A9B6A',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#000000',
          image: './assets/icon.png',
          resizeMode: 'contain',
          ios: {
            enableFullScreenImage_legacy: true,
          },
          android: {
            imageWidth: 320,
          },
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          iosUrlScheme: 'com.googleusercontent.apps.800321101197-4nf91b2m0jucansncl7e1nkqfibr168e',
        },
      ],
    ],
    extra: {
      eas: {
        projectId: 'be6214a8-76f6-43dd-a979-767e036a37fa',
      },
    },
    owner: 'bbabiker',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: 'https://u.expo.dev/be6214a8-76f6-43dd-a979-767e036a37fa',
    },
  },
};

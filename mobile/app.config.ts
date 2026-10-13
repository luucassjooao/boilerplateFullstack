import type { ConfigContext, ExpoConfig } from 'expo/config';

// Build-time values (not EXPO_PUBLIC_: only read here, never shipped in the JS bundle).
// `||`, not `??`: `KEY=` in .env is an empty string.
const bundleId = process.env.APP_BUNDLE_ID || 'com.example.app';
// Reversed iOS client ID from Google Cloud, e.g. com.googleusercontent.apps.1234-abcd
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME || 'com.googleusercontent.apps.placeholder';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'App',
  slug: config.slug ?? 'mobile',
  ios: {
    ...config.ios,
    bundleIdentifier: bundleId,
    usesAppleSignIn: true,
  },
  android: {
    ...config.android,
    package: bundleId,
  },
  plugins: [
    'expo-secure-store',
    'expo-apple-authentication',
    ['expo-splash-screen', { image: './assets/icon.png', imageWidth: 120, backgroundColor: '#ffffff' }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }],
  ],
});

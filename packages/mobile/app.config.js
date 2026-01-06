const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'OpenCode Dev';
  if (IS_PREVIEW) return 'OpenCode Preview';
  return 'OpenCode';
};

const getBundleId = () => {
  if (IS_DEV) return 'ceo.nerd.opencode.dev';
  if (IS_PREVIEW) return 'ceo.nerd.opencode.preview';
  return 'ceo.nerd.opencode';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'opencode',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'opencode',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    platforms: ['ios'],
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#100F0F',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleId(),
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription:
          'OpenCode needs camera access to scan QR codes for server pairing',
        NSFaceIDUsageDescription:
          'OpenCode uses Face ID to secure your authentication tokens',
        NSLocalNetworkUsageDescription:
          'OpenCode discovers local servers on your network',
        NSBonjourServices: ['_opencode._tcp', '_http._tcp'],
        LSSupportsOpeningDocumentsInPlace: true,
        UIFileSharingEnabled: true,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
      config: {
        usesNonExemptEncryption: false,
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#100F0F',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/IBMPlexMono-Regular.ttf',
            './assets/fonts/IBMPlexMono-Medium.ttf',
            './assets/fonts/IBMPlexMono-SemiBold.ttf',
            './assets/fonts/IBMPlexMono-Bold.ttf',
          ],
        },
      ],
      'expo-secure-store',
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow OpenCode to access your camera to scan QR codes',
        },
      ],
      [
        'expo-local-authentication',
        {
          faceIDPermission:
            'Allow OpenCode to use Face ID for secure authentication',
        },
      ],
      [
        'expo-file-system',
        {
          supportsOpeningDocumentsInPlace: true,
          enableFileSharing: true,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '0f1f6641-2847-4b02-9961-7d1354754b44',
      },
    },
    owner: 'heynerd',
  },
};

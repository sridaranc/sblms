import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

const getDevHost = (): string => {
  // Web always uses localhost
  if (isWeb) return 'localhost';

  // 1. Check for explicit env override (set in .env or export before running)
  //    This is the most reliable method for real devices.
  //    e.g. EXPO_PUBLIC_DEV_HOST=192.168.1.42
  const envHost = (process.env as any).EXPO_PUBLIC_DEV_HOST;
  if (envHost) return envHost;

  // 2. Try expo-constants to detect dev server host automatically
  //    Works with Expo dev server and returns the correct LAN IP for real devices.
  try {
    const Constants = require('expo-constants').default;
    const debuggerHost = Constants?.expoConfig?.hostUri ?? Constants?.manifest?.debuggerHost;
    if (debuggerHost) {
      // debuggerHost format: "192.168.0.5:8081" or "localhost:8081"
      const host = debuggerHost.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return host;
      }
      // If it resolved to localhost (simulator), still return it for simulators
      if (host === 'localhost') return host;
    }
  } catch {
    // expo-constants not available, continue to fallbacks
  }

  // 3. Android emulator uses 10.0.2.2 to reach host machine's localhost
  //    Only use this when actually running in an emulator (detected via app.json debug settings)
  if (Platform.OS === 'android') return '10.0.2.2';

  // 4. Last resort fallback — update this to your machine's LAN IP if needed
  return '192.168.0.5';
};

const DEV_HOST = getDevHost();
const API_BASE_URL = __DEV__ ? `http://${DEV_HOST}:5080` : 'https://api.sblms.com';

export const API_URL = API_BASE_URL;
export const API_URL_WITH_PATH = `${API_BASE_URL}/api`;

if (__DEV__) {
  console.log(`[API] Platform: ${Platform.OS} | Host: ${DEV_HOST} | URL: ${API_URL}`);
}

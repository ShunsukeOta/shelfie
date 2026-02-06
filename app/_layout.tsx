import '@/global.css';

import { AuthGate } from '@/components/auth-gate';
import { AuthProvider } from '@/components/auth-provider';
import { RegisterModalProvider } from '@/components/register-modal-provider';
import { LibraryProvider } from '@/lib/library';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <SafeAreaProvider>
        <AuthProvider>
          <AuthGate>
            <LibraryProvider>
              <RegisterModalProvider>
                <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false }} />
                <PortalHost />
              </RegisterModalProvider>
            </LibraryProvider>
          </AuthGate>
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

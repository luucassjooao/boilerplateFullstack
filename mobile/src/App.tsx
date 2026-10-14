import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@app/contexts/AuthContext/AuthProvider';
import { Navigation } from '@app/navigation';
import { queryClient } from '@app/lib/queryClient';

// Kept until AuthProvider knows whether there is a session.
void SplashScreen.preventAutoHideAsync();

export function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </QueryClientProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

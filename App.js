import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import EmulatorBanner from './src/components/EmulatorBanner';
import PushNotificationSetup from './src/components/PushNotificationSetup';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { EventProvider } from './src/context/EventContext';
import { MarketProvider } from './src/context/MarketContext';
import { CommunityProvider } from './src/context/CommunityContext';
import { ChatProvider } from './src/context/ChatContext';
import RootNavigator from './src/navigation/RootNavigator';

function AppContent() {
  const { isDark } = useTheme();
  const barStyle = isDark ? 'light' : 'dark';
  return (
    <>
      <StatusBar style={barStyle} />
      <EmulatorBanner />
      <PushNotificationSetup />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <EventProvider>
              <MarketProvider>
                <CommunityProvider>
                  <ChatProvider>
                    <AppContent />
                  </ChatProvider>
                </CommunityProvider>
              </MarketProvider>
            </EventProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

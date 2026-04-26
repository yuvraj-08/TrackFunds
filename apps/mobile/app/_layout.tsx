import { ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import 'react-native-reanimated'

import { appNavigationTheme } from '@/src/constants/theme'
import { LockProvider } from '@/src/providers/lock-provider'
import { SessionProvider } from '@/src/providers/session-provider'

export default function RootLayout() {
  return (
    <SessionProvider>
      <ThemeProvider value={appNavigationTheme}>
        <LockProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
          <StatusBar style="dark" />
        </LockProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

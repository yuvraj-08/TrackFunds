import { Redirect, Stack, useSegments } from 'expo-router'

import { useSession } from '@/src/hooks/use-session'

export default function AuthLayout() {
  const { isReady, session } = useSession()
  const segments = useSegments()

  if (!isReady) {
    return null
  }

  const activeRoute = segments[segments.length - 1]
  const canStayOnAuthRoute = activeRoute === 'forgot-password' || activeRoute === 'reset-password'

  if (session && !canStayOnAuthRoute) {
    return <Redirect href={'/(app)/(tabs)/home' as never} />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}

import { Redirect, Stack } from 'expo-router'

import { useSession } from '@/src/hooks/use-session'

export default function AppLayout() {
  const { isReady, session } = useSession()

  if (!isReady) {
    return null
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        headerTintColor: '#1f2337',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="lock-settings" options={{ title: 'App Lock' }} />
      <Stack.Screen name="invitations/redeem" options={{ title: 'Redeem invite' }} />
      <Stack.Screen name="accounts/index" options={{ headerShown: false }} />
      <Stack.Screen name="accounts/create" options={{ title: 'Create account' }} />
      <Stack.Screen name="accounts/[accountId]/index" options={{ title: 'Account detail' }} />
      <Stack.Screen name="accounts/[accountId]/edit" options={{ title: 'Edit account' }} />
      <Stack.Screen
        name="accounts/[accountId]/participants"
        options={{ title: 'Manage participants' }}
      />
      <Stack.Screen
        name="accounts/[accountId]/transactions/deposit"
        options={{ title: 'Add deposit' }}
      />
      <Stack.Screen
        name="accounts/[accountId]/transactions/withdrawal"
        options={{ title: 'Add withdrawal' }}
      />
      <Stack.Screen
        name="accounts/[accountId]/transactions/[transactionId]"
        options={{ title: 'Edit transaction' }}
      />
    </Stack>
  )
}

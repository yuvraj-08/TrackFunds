import { Redirect } from 'expo-router'

import { useSession } from '@/src/hooks/use-session'

export default function IndexScreen() {
  const { isReady, session } = useSession()

  if (!isReady) {
    return null
  }

  return <Redirect href={(session ? '/(app)/(tabs)/home' : '/(auth)/login') as never} />
}

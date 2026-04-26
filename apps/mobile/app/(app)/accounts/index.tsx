import { Redirect } from 'expo-router'

export default function AccountsIndexRoute() {
  return <Redirect href={'/(app)/(tabs)/accounts' as never} />
}

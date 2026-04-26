import * as SecureStore from 'expo-secure-store'

const SESSION_KEY = 'trackfunds.session'

export async function readStoredSession() {
  const rawValue = await SecureStore.getItemAsync(SESSION_KEY)
  return rawValue ? rawValue : null
}

export async function writeStoredSession(value: string) {
  await SecureStore.setItemAsync(SESSION_KEY, value)
}

export async function clearStoredSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY)
}

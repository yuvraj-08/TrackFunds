import * as SecureStore from 'expo-secure-store'

const KEYS = {
  enabled: 'trackfunds.lock.enabled',
  pin: 'trackfunds.lock.pin',
  timeout: 'trackfunds.lock.timeout',
} as const

export async function readLockPin(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.pin)
}

export async function writeLockPin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.pin, pin)
}

export async function clearLockPin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.pin)
}

export async function readLockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEYS.enabled)) === 'true'
}

export async function writeLockEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(KEYS.enabled, enabled ? 'true' : 'false')
}

export async function readLockTimeout(): Promise<number> {
  const val = await SecureStore.getItemAsync(KEYS.timeout)
  return val ? parseInt(val, 10) : 30
}

export async function writeLockTimeout(seconds: number): Promise<void> {
  await SecureStore.setItemAsync(KEYS.timeout, String(seconds))
}

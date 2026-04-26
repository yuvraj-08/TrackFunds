import * as LocalAuthentication from 'expo-local-authentication'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { PinPad } from '@/src/components/pin-pad'
import {
  clearLockPin,
  readLockEnabled,
  readLockPin,
  readLockTimeout,
  writeLockEnabled,
  writeLockPin,
  writeLockTimeout,
} from '@/src/lib/lock-storage'
import { SessionContext } from '@/src/providers/session-provider'

// ─── Context ──────────────────────────────────────────────────────────────────

type LockContextValue = {
  isEnabled: boolean
  timeout: number
  enableLock: (pin: string) => Promise<void>
  disableLock: (pin: string) => Promise<boolean>
  changePin: (currentPin: string, newPin: string) => Promise<boolean>
  verifyPin: (pin: string) => Promise<boolean>
  updateTimeout: (seconds: number) => Promise<void>
}

export const LockContext = createContext<LockContextValue | null>(null)

export function useLock() {
  const ctx = useContext(LockContext)
  if (!ctx) throw new Error('useLock must be used inside LockProvider')
  return ctx
}

// ─── Forgot PIN modal ─────────────────────────────────────────────────────────

function ForgotPinSheet({
  email,
  onVerified,
  onClose,
}: {
  email: string
  onVerified: () => void
  onClose: () => void
}) {
  const session = useContext(SessionContext)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!password.trim()) return
    setLoading(true)
    setError(null)
    try {
      await session?.signIn({ email, password })
      onVerified()
    } catch {
      setError('Incorrect password. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={forgotStyles.backdrop}>
      <View style={forgotStyles.sheet}>
        <Text style={forgotStyles.title}>Forgot PIN?</Text>
        <Text style={forgotStyles.body}>
          Enter your TrackFunds password to verify your identity. You'll be able to set a new PIN
          after.
        </Text>
        <Text style={forgotStyles.emailLabel}>{email}</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="rgba(31,35,55,0.35)"
          secureTextEntry
          style={forgotStyles.input}
          autoFocus
        />
        {error ? <Text style={forgotStyles.error}>{error}</Text> : null}
        <View style={forgotStyles.actions}>
          <Pressable onPress={onClose} style={forgotStyles.cancelBtn}>
            <Text style={forgotStyles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={() => void handleVerify()}
            disabled={loading || !password.trim()}
            style={[forgotStyles.verifyBtn, (!password.trim() || loading) ? forgotStyles.verifyBtnDisabled : null]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={forgotStyles.verifyText}>Verify</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const forgotStyles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    bottom: 0,
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: '#fff9f4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 14,
    padding: 28,
    paddingBottom: 44,
    width: '100%',
  },
  title: { color: '#1f2337', fontSize: 20, fontWeight: '800' },
  body: { color: '#6f6676', fontSize: 14, lineHeight: 21 },
  emailLabel: { color: '#2f4d8f', fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: '#f5efe7',
    borderRadius: 12,
    color: '#1f2337',
    fontSize: 15,
    padding: 14,
  },
  error: { color: '#b63b34', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    alignItems: 'center',
    backgroundColor: '#ede7d8',
    borderRadius: 999,
    flex: 1,
    paddingVertical: 14,
  },
  cancelText: { color: '#1f2337', fontWeight: '700' },
  verifyBtn: {
    alignItems: 'center',
    backgroundColor: '#2f4d8f',
    borderRadius: 999,
    flex: 1,
    paddingVertical: 14,
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyText: { color: '#fff', fontWeight: '700' },
})

// ─── Lock screen ──────────────────────────────────────────────────────────────

type LockStep = 'unlock' | 'forgot'

function LockScreen({
  email,
  onUnlocked,
  onPinCleared,
}: {
  email: string
  onUnlocked: () => void
  onPinCleared: () => void
}) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [step, setStep] = useState<LockStep>('unlock')
  const [hasBiometric, setHasBiometric] = useState(false)

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((has) => {
      if (!has) return
      LocalAuthentication.isEnrolledAsync().then(setHasBiometric)
    })
  }, [])

  // Auto-trigger biometrics on open
  useEffect(() => {
    if (hasBiometric) void triggerBiometric()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBiometric])

  const triggerBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock TrackFunds',
      fallbackLabel: 'Use PIN',
    })
    if (result.success) onUnlocked()
  }

  const handleChange = async (next: string) => {
    setPin(next)
    setError(false)
    if (next.length === 6) {
      const stored = await readLockPin()
      if (next === stored) {
        onUnlocked()
      } else {
        setError(true)
        setTimeout(() => {
          setPin('')
          setError(false)
        }, 600)
      }
    }
  }

  return (
    <View style={lockStyles.screen}>
      <View style={lockStyles.top}>
        <Text style={lockStyles.appName}>TrackFunds</Text>
        <Text style={lockStyles.subtitle}>
          {error ? 'Incorrect PIN — try again' : 'Enter your PIN to continue'}
        </Text>
      </View>

      <PinPad
        value={pin}
        onChange={(v) => void handleChange(v)}
        onBiometric={() => void triggerBiometric()}
        hasBiometric={hasBiometric}
        error={error}
      />

      <Pressable onPress={() => setStep('forgot')} style={lockStyles.forgotBtn}>
        <Text style={lockStyles.forgotText}>Forgot PIN?</Text>
      </Pressable>

      {step === 'forgot' ? (
        <ForgotPinSheet
          email={email}
          onClose={() => setStep('unlock')}
          onVerified={async () => {
            await clearLockPin()
            await writeLockEnabled(false)
            onPinCleared()
          }}
        />
      ) : null}
    </View>
  )
}

const lockStyles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#17233f',
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 56,
    paddingTop: 100,
  },
  top: { alignItems: 'center', gap: 10 },
  appName: { color: '#f5f1e8', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: 'rgba(198,209,198,0.8)', fontSize: 15 },
  forgotBtn: { paddingVertical: 8 },
  forgotText: { color: 'rgba(198,209,198,0.7)', fontSize: 14, fontWeight: '600' },
})

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LockProvider({ children }: { children: React.ReactNode }) {
  const sessionCtx = useContext(SessionContext)
  const session = sessionCtx?.session ?? null

  const [isEnabled, setIsEnabled] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [timeout, setTimeoutSecs] = useState(30)
  const [isSettingsReady, setIsSettingsReady] = useState(false)
  const [pinClearedNeedsSetup, setPinClearedNeedsSetup] = useState(false)

  const backgroundTimeRef = useRef<number | null>(null)
  const hasLockedRef = useRef(false)

  // Load settings on mount
  useEffect(() => {
    async function load() {
      const [enabled, savedTimeout] = await Promise.all([readLockEnabled(), readLockTimeout()])
      setIsEnabled(enabled)
      setTimeoutSecs(savedTimeout)
      setIsSettingsReady(true)
    }
    void load()
  }, [])

  // Lock on session ready + enabled
  useEffect(() => {
    if (!isSettingsReady) return
    if (!session) {
      setIsLocked(false)
      hasLockedRef.current = false
      return
    }
    if (isEnabled && !hasLockedRef.current) {
      setIsLocked(true)
      hasLockedRef.current = true
    }
  }, [isSettingsReady, session, isEnabled])

  // Background → foreground timeout
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        backgroundTimeRef.current = Date.now()
      } else if (next === 'active') {
        if (isEnabled && session && backgroundTimeRef.current !== null) {
          const elapsed = (Date.now() - backgroundTimeRef.current) / 1000
          if (timeout === 0 || elapsed >= timeout) {
            setIsLocked(true)
          }
        }
        backgroundTimeRef.current = null
      }
    })
    return () => sub.remove()
  }, [isEnabled, session, timeout])

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    const stored = await readLockPin()
    return stored === pin
  }, [])

  const enableLock = useCallback(async (pin: string) => {
    await writeLockPin(pin)
    await writeLockEnabled(true)
    setIsEnabled(true)
    hasLockedRef.current = true
  }, [])

  const disableLock = useCallback(async (pin: string): Promise<boolean> => {
    const ok = await verifyPin(pin)
    if (!ok) return false
    await clearLockPin()
    await writeLockEnabled(false)
    setIsEnabled(false)
    setIsLocked(false)
    return true
  }, [verifyPin])

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    const ok = await verifyPin(currentPin)
    if (!ok) return false
    await writeLockPin(newPin)
    return true
  }, [verifyPin])

  const updateTimeout = useCallback(async (seconds: number) => {
    await writeLockTimeout(seconds)
    setTimeoutSecs(seconds)
  }, [])

  const shouldShowLock = isLocked && isEnabled && !!session && !pinClearedNeedsSetup

  return (
    <LockContext.Provider value={{ isEnabled, timeout, enableLock, disableLock, changePin, verifyPin, updateTimeout }}>
      {children}
      <Modal visible={shouldShowLock || pinClearedNeedsSetup} animationType="fade" statusBarTranslucent>
        {shouldShowLock ? (
          <LockScreen
            email={session?.user.email ?? ''}
            onUnlocked={() => setIsLocked(false)}
            onPinCleared={() => {
              setIsEnabled(false)
              setIsLocked(false)
              setPinClearedNeedsSetup(true)
            }}
          />
        ) : pinClearedNeedsSetup ? (
          <PinClearedNotice onDismiss={() => setPinClearedNeedsSetup(false)} />
        ) : null}
      </Modal>
    </LockContext.Provider>
  )
}

function PinClearedNotice({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={noticeStyles.screen}>
      <Text style={noticeStyles.title}>PIN removed</Text>
      <Text style={noticeStyles.body}>
        Your PIN has been cleared. You can set a new one in Profile → App Lock.
      </Text>
      <Pressable onPress={onDismiss} style={noticeStyles.btn}>
        <Text style={noticeStyles.btnText}>Continue</Text>
      </Pressable>
    </View>
  )
}

const noticeStyles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#17233f',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 40,
  },
  title: { color: '#f5f1e8', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { color: 'rgba(198,209,198,0.8)', fontSize: 15, lineHeight: 22, textAlign: 'center' },
  btn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  btnText: { color: '#f5f1e8', fontSize: 16, fontWeight: '700' },
})

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { PinPad } from '@/src/components/pin-pad'
import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useLock } from '@/src/providers/lock-provider'

// ─── Timeout options ──────────────────────────────────────────────────────────

const TIMEOUT_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: 'After 30 seconds', value: 30 },
  { label: 'After 1 minute', value: 60 },
  { label: 'After 5 minutes', value: 300 },
  { label: 'After 15 minutes', value: 900 },
]

// ─── PIN flow steps ───────────────────────────────────────────────────────────

type FlowStep =
  | 'idle'
  | 'setup-enter'
  | 'setup-confirm'
  | 'disable-verify'
  | 'change-current'
  | 'change-new'
  | 'change-confirm'

export default function LockSettingsScreen() {
  const router = useRouter()
  const { isEnabled, timeout, enableLock, disableLock, changePin, verifyPin, updateTimeout } = useLock()

  const [step, setStep] = useState<FlowStep>('idle')
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pendingPin, setPendingPin] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const resetFlow = () => {
    setStep('idle')
    setPin('')
    setNewPin('')
    setPendingPin('')
    setPinError(false)
  }

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 2500)
  }

  // ── Handlers ──

  const handlePinChange = async (next: string) => {
    setPin(next)
    setPinError(false)

    if (next.length < 6) return

    if (step === 'setup-enter') {
      setPendingPin(next)
      setPin('')
      setStep('setup-confirm')
      return
    }

    if (step === 'setup-confirm') {
      if (next !== pendingPin) {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
        return
      }
      await enableLock(next)
      showSuccess('App lock enabled')
      resetFlow()
      return
    }

    if (step === 'disable-verify') {
      const ok = await disableLock(next)
      if (!ok) {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
        return
      }
      showSuccess('App lock disabled')
      resetFlow()
      return
    }

    if (step === 'change-current') {
      const ok = await verifyPin(next)
      if (!ok) {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
        return
      }
      setPendingPin(next)
      setPin('')
      setStep('change-new')
      return
    }

    if (step === 'change-new') {
      setNewPin(next)
      setPin('')
      setStep('change-confirm')
      return
    }

    if (step === 'change-confirm') {
      if (next !== newPin) {
        setPinError(true)
        setTimeout(() => { setPin(''); setPinError(false) }, 600)
        return
      }
      await changePin(pendingPin, next)
      showSuccess('PIN updated')
      resetFlow()
      return
    }
  }

  // ── Step screens ──

  if (step !== 'idle') {
    const stepLabels: Record<Exclude<FlowStep, 'idle'>, string> = {
      'setup-enter': 'Create a 6-digit PIN',
      'setup-confirm': 'Confirm your PIN',
      'disable-verify': 'Enter your current PIN',
      'change-current': 'Enter your current PIN',
      'change-new': 'Enter your new PIN',
      'change-confirm': 'Confirm your new PIN',
    }

    return (
      <View style={pinStyles.screen}>
        <Pressable onPress={resetFlow} style={pinStyles.back}>
          <Ionicons name="chevron-back" size={22} color="rgba(245,241,232,0.8)" />
          <Text style={pinStyles.backText}>Cancel</Text>
        </Pressable>

        <View style={pinStyles.content}>
          <Text style={pinStyles.stepTitle}>{stepLabels[step]}</Text>
          {pinError ? (
            <Text style={pinStyles.stepError}>
              {step === 'setup-confirm' || step === 'change-confirm'
                ? "PINs don't match — try again"
                : 'Incorrect PIN — try again'}
            </Text>
          ) : (
            <Text style={pinStyles.stepHint}>
              {step === 'setup-confirm' || step === 'change-confirm'
                ? 'Re-enter the same PIN'
                : ' '}
            </Text>
          )}
          <PinPad value={pin} onChange={(v) => void handlePinChange(v)} error={pinError} />
        </View>
      </View>
    )
  }

  // ── Main settings view ──

  return (
    <AppScreen title="App Lock" subtitle="Require a PIN every time the app opens or resumes.">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {successMsg ? (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Status card */}
        <View style={[styles.statusCard, isEnabled ? styles.statusEnabled : styles.statusDisabled]}>
          <Ionicons
            name={isEnabled ? 'lock-closed' : 'lock-open-outline'}
            size={28}
            color={isEnabled ? theme.colors.accent : theme.colors.muted}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{isEnabled ? 'App Lock is ON' : 'App Lock is OFF'}</Text>
            <Text style={styles.statusBody}>
              {isEnabled
                ? 'A PIN is required every time the app opens or resumes from background.'
                : 'Anyone with access to your device can open the app without a PIN.'}
            </Text>
          </View>
        </View>

        {/* Enable */}
        {!isEnabled ? (
          <PrimaryButton label="Enable App Lock" onPress={() => setStep('setup-enter')} />
        ) : null}

        {/* Timeout (only when enabled) */}
        {isEnabled ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lock after</Text>
            <View style={styles.menuCard}>
              {TIMEOUT_OPTIONS.map((opt, index) => {
                const isSelected = opt.value === timeout
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => void updateTimeout(opt.value)}
                    style={[
                      styles.timeoutRow,
                      index === 0 ? styles.timeoutRowFirst : null,
                    ]}
                  >
                    <Text style={[styles.timeoutLabel, isSelected ? styles.timeoutLabelSelected : null]}>
                      {opt.label}
                    </Text>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
                    ) : null}
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {/* PIN management (only when enabled) */}
        {isEnabled ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PIN</Text>
            <View style={styles.menuCard}>
              <Pressable onPress={() => setStep('change-current')} style={styles.menuRow}>
                <View style={styles.menuIcon}>
                  <Ionicons name="key-outline" size={18} color={theme.colors.accent} />
                </View>
                <Text style={styles.menuLabel}>Change PIN</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
              </Pressable>
              <View style={styles.menuDivider} />
              <Pressable onPress={() => setStep('disable-verify')} style={styles.menuRow}>
                <View style={[styles.menuIcon, styles.menuIconDanger]}>
                  <Ionicons name="lock-open-outline" size={18} color={theme.colors.danger} />
                </View>
                <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Disable App Lock</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.muted} />
          <Text style={styles.infoText}>
            If you forget your PIN, you can verify your identity using your TrackFunds password from
            the lock screen.
          </Text>
        </View>

      </ScrollView>
    </AppScreen>
  )
}

// ─── PIN screen styles ────────────────────────────────────────────────────────

const pinStyles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    backgroundColor: '#17233f',
    flex: 1,
    paddingTop: 64,
  },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    marginLeft: 16,
    marginBottom: 32,
    padding: 4,
  },
  backText: { color: 'rgba(245,241,232,0.8)', fontSize: 16 },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    paddingBottom: 80,
  },
  stepTitle: { color: '#f5f1e8', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  stepHint: { color: 'rgba(198,209,198,0.6)', fontSize: 14, minHeight: 20 },
  stepError: { color: '#ffb3b3', fontSize: 14, minHeight: 20 },
})

// ─── Settings screen styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    gap: 20,
    paddingBottom: 40,
  },
  successBanner: {
    alignItems: 'center',
    backgroundColor: '#e6f4ef',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  successText: { color: theme.colors.success, fontSize: 14, fontWeight: '600' },
  statusCard: {
    alignItems: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 18,
  },
  statusEnabled: {
    backgroundColor: theme.colors.softForest,
    borderColor: '#c8cef0',
  },
  statusDisabled: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  statusText: { flex: 1, gap: 6 },
  statusTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
  statusBody: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  section: { gap: 8 },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  menuIconDanger: { backgroundColor: '#fff0ef' },
  menuLabel: { color: theme.colors.text, flex: 1, fontSize: 15, fontWeight: '600' },
  menuLabelDanger: { color: theme.colors.danger },
  menuDivider: {
    backgroundColor: theme.colors.border,
    height: 1,
    marginLeft: 64,
  },
  timeoutRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  timeoutRowFirst: { borderTopWidth: 0 },
  timeoutLabel: { color: theme.colors.text, fontSize: 15 },
  timeoutLabelSelected: { color: theme.colors.accent, fontWeight: '700' },
  infoCard: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  infoText: { color: theme.colors.muted, flex: 1, fontSize: 13, lineHeight: 19 },
})

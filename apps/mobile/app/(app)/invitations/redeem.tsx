import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type { InvitationPreview } from '@/src/lib/api'

const PERMISSION_LABELS = [
  { key: 'canView', label: 'View account & transactions' },
  { key: 'canAddTransactions', label: 'Add transactions' },
  { key: 'canEditTransactions', label: 'Edit transactions' },
  { key: 'canDeleteTransactions', label: 'Delete transactions' },
  { key: 'canManageParticipants', label: 'Manage participants' },
] as const

export default function RedeemInviteScreen() {
  const router = useRouter()
  const { api } = useSession()

  const [code, setCode] = useState('')
  const [preview, setPreview] = useState<InvitationPreview | null>(null)
  const [step, setStep] = useState<'enter' | 'preview' | 'done'>('enter')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 8) {
      setError('Enter the full 8-character invite code.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await api.lookupInvitation(trimmed)
      setPreview(result)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invite code not found.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      await api.acceptInvitation(code.trim().toUpperCase())
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      await api.declineInvitation(code.trim().toUpperCase())
      router.back()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decline invitation.')
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <AppScreen title="Invitation accepted">
        <View style={styles.doneState}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success} />
          </View>
          <Text style={styles.doneTitle}>You're in!</Text>
          <Text style={styles.doneBody}>
            You've joined <Text style={styles.bold}>{preview?.accountName}</Text>. It's now visible
            in your Accounts tab.
          </Text>
          <PrimaryButton
            label="Go to Accounts"
            onPress={() => router.replace('/(app)/(tabs)/accounts' as never)}
          />
        </View>
      </AppScreen>
    )
  }

  return (
    <AppScreen
      scrollable={false}
      title="Redeem invite"
      subtitle="Enter the 8-character code from your invitation email."
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Code input */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Invite code</Text>
            <TextInput
              value={code}
              onChangeText={(v) => {
                setCode(v.toUpperCase().replace(/[^A-Z2-9]/g, ''))
                setError(null)
                if (step === 'preview') { setStep('enter'); setPreview(null) }
              }}
              placeholder="A3B7XKQP"
              placeholderTextColor={theme.colors.border}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.codeInput}
            />
            <Text style={styles.codeHint}>{code.length}/8 characters</Text>
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          {step === 'enter' ? (
            <PrimaryButton
              label="Look up invitation"
              onPress={() => void handleLookup()}
              loading={loading}
              disabled={code.length !== 8}
            />
          ) : null}

          {/* Preview card */}
          {step === 'preview' && preview ? (
            <View style={styles.previewCard}>
              <View style={styles.previewHero}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.previewAvatarText}>
                    {preview.accountName
                      .split(' ')
                      .slice(0, 2)
                      .map((w) => w[0]?.toUpperCase() ?? '')
                      .join('')}
                  </Text>
                </View>
                <View style={styles.previewMeta}>
                  <Text style={styles.previewAccountName}>{preview.accountName}</Text>
                  <Text style={styles.previewInviter}>
                    Invited by {preview.invitedByName}
                  </Text>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{preview.accountCurrencyCode}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.permissionsSection}>
                <Text style={styles.permissionsLabel}>Your permissions</Text>
                {PERMISSION_LABELS.map(({ key, label }) => {
                  const granted = preview.permissions[key]
                  return (
                    <View key={key} style={styles.permissionRow}>
                      <Ionicons
                        name={granted ? 'checkmark-circle' : 'close-circle-outline'}
                        size={16}
                        color={granted ? theme.colors.success : theme.colors.border}
                      />
                      <Text style={[styles.permissionLabel, !granted ? styles.permissionLabelDimmed : null]}>
                        {label}
                      </Text>
                    </View>
                  )
                })}
              </View>

              <Text style={styles.expiryNote}>
                Expires {new Date(preview.expiresAt).toLocaleDateString(undefined, {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>

              <View style={styles.previewActions}>
                <PrimaryButton
                  label="Accept invitation"
                  onPress={() => void handleAccept()}
                  loading={loading}
                />
                <PrimaryButton
                  label="Decline"
                  onPress={() => void handleDecline()}
                  tone="ghost"
                  disabled={loading}
                />
              </View>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 40,
  },
  codeCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  codeLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  codeInput: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  codeHint: {
    color: theme.colors.border,
    fontSize: 12,
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
  },
  previewCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  previewHero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  previewAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  previewAvatarText: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  previewMeta: { flex: 1, gap: 4 },
  previewAccountName: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  previewInviter: { color: theme.colors.muted, fontSize: 13 },
  previewBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.softForest,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  previewBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  permissionsSection: { gap: 10 },
  permissionsLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  permissionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  permissionLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  permissionLabelDimmed: { color: theme.colors.border },
  expiryNote: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  previewActions: { gap: 10 },
  bold: { fontWeight: '700' },
  doneState: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  doneIcon: {
    alignItems: 'center',
    backgroundColor: '#e6f4ef',
    borderRadius: 32,
    height: 88,
    justifyContent: 'center',
    marginBottom: 8,
    width: 88,
  },
  doneTitle: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  doneBody: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
})

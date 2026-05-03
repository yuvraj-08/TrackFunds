import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { SectionCard } from '@/src/components/section-card'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type { AccountParticipantRecord, InvitationRecord } from '@/src/lib/api'

type PermissionKey =
  | 'canAddTransactions'
  | 'canDeleteTransactions'
  | 'canEditTransactions'
  | 'canManageParticipants'
  | 'canView'

const PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'canView', label: 'View', description: 'Can see the account and its transactions' },
  { key: 'canAddTransactions', label: 'Add transactions', description: 'Can record deposits and withdrawals' },
  { key: 'canEditTransactions', label: 'Edit transactions', description: 'Can modify existing entries' },
  { key: 'canDeleteTransactions', label: 'Delete transactions', description: 'Can remove ledger entries' },
  { key: 'canManageParticipants', label: 'Manage participants', description: 'Can invite and remove members' },
]

function ParticipantCard({
  participant,
  onToggle,
  onRemove,
  updating,
}: {
  participant: AccountParticipantRecord
  onToggle: (key: PermissionKey) => void
  onRemove: () => void
  updating: PermissionKey | null
}) {
  const [expanded, setExpanded] = useState(false)

  const initials = participant.user.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  const grantedCount = PERMISSIONS.filter(({ key }) => participant[key]).length

  return (
    <View style={styles.card}>
      {/* Header — always visible, tap to expand */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={({ pressed }) => [styles.cardHeader, pressed ? styles.cardHeaderPressed : null]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardName}>{participant.user.displayName}</Text>
          <Text style={styles.cardEmail}>{participant.user.email}</Text>
        </View>
        <View style={styles.cardSummary}>
          <Text style={styles.cardSummaryText}>{grantedCount}/{PERMISSIONS.length}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={theme.colors.muted}
          />
        </View>
      </Pressable>

      {/* Expanded: permissions + remove */}
      {expanded ? (
        <View style={styles.permissions}>
          {PERMISSIONS.map(({ key, label, description }, index) => (
            <View
              key={key}
              style={[styles.permissionRow, index === 0 ? styles.permissionRowFirst : null]}
            >
              <View style={styles.permissionInfo}>
                <Text style={styles.permissionLabel}>{label}</Text>
                <Text style={styles.permissionDesc}>{description}</Text>
              </View>
              <Switch
                value={participant[key]}
                onValueChange={() => onToggle(key)}
                disabled={updating !== null}
                trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
          ))}
          <View style={styles.removeRow}>
            <PrimaryButton compact label="Remove participant" onPress={onRemove} tone="danger" />
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default function ParticipantsScreen() {
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const { api } = useSession()
  const [participants, setParticipants] = useState<AccountParticipantRecord[]>([])
  const [invitations, setInvitations] = useState<InvitationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<{ participantId: string; key: PermissionKey } | null>(null)

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePerms, setInvitePerms] = useState({
    canView: true,
    canAddTransactions: false,
    canEditTransactions: false,
    canDeleteTransactions: false,
    canManageParticipants: false,
  })
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!accountId) return
    try {
      setError(null)
      const [p, inv] = await Promise.all([
        api.listParticipants(accountId),
        api.listInvitations(accountId).catch(() => [] as InvitationRecord[]),
      ])
      setParticipants(p)
      setInvitations(inv)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load participants.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [accountId, api])

  useFocusEffect(
    useCallback(() => {
      void loadData()
    }, [loadData]),
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  const handleToggle = async (participant: AccountParticipantRecord, key: PermissionKey) => {
    if (!accountId || updating) return
    setUpdating({ participantId: participant.id, key })

    // Optimistic update
    setParticipants((prev) =>
      prev.map((p) => (p.id === participant.id ? { ...p, [key]: !p[key] } : p)),
    )

    try {
      await api.updateParticipant(accountId, participant.id, { [key]: !participant[key] })
    } catch (err) {
      // Revert on failure
      setParticipants((prev) =>
        prev.map((p) => (p.id === participant.id ? { ...p, [key]: participant[key] } : p)),
      )
      Alert.alert(
        'Could not update permission',
        err instanceof Error ? err.message : 'Unknown error.',
      )
    } finally {
      setUpdating(null)
    }
  }

  const handleSendInvite = async () => {
    if (!accountId || !inviteEmail.trim()) return
    setInviteSending(true)
    setInviteError(null)
    setInviteSuccess(null)
    try {
      await api.createInvitation(accountId, { email: inviteEmail.trim(), ...invitePerms })
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`)
      setInviteEmail('')
      await loadData()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Could not send invitation.')
    } finally {
      setInviteSending(false)
    }
  }

  const handleResendInvitation = async (invitationId: string, email: string) => {
    if (!accountId) return
    try {
      await api.resendInvitation(accountId, invitationId)
      Alert.alert('Invitation resent', `A new invite email has been sent to ${email}.`)
      await loadData()
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not resend invitation.')
    }
  }

  const handleCancelInvitation = async (invitationId: string, email: string) => {
    if (!accountId) return
    Alert.alert('Cancel invitation?', `Cancel the pending invite for ${email}?`, [
      { style: 'cancel', text: 'Keep' },
      {
        style: 'destructive',
        text: 'Cancel invite',
        onPress: async () => {
          try {
            await api.cancelInvitation(accountId, invitationId)
            await loadData()
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Could not cancel invitation.')
          }
        },
      },
    ])
  }

  const handleRemove = (participant: AccountParticipantRecord) => {
    if (!accountId) return
    Alert.alert(
      'Remove participant?',
      `${participant.user.displayName} will lose access to this account.`,
      [
        { style: 'cancel', text: 'Cancel' },
        {
          style: 'destructive',
          text: 'Remove',
          onPress: async () => {
            try {
              await api.removeParticipant(accountId, participant.id)
              await loadData()
            } catch (err) {
              Alert.alert(
                'Could not remove participant',
                err instanceof Error ? err.message : 'Unknown error.',
              )
            }
          },
        },
      ],
    )
  }

  return (
    <AppScreen
      scrollable={false}
      title="Participants"
      subtitle="Manage who has access and what they can do."
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Invite form */}
        <SectionCard title="Invite participant" accent="forest">
          <View style={styles.inviteForm}>
            <TextInput
              value={inviteEmail}
              onChangeText={(v) => { setInviteEmail(v); setInviteError(null) }}
              placeholder="Email address"
              placeholderTextColor={theme.colors.border}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.inviteInput}
            />
            <View style={styles.invitePerms}>
              {([
                ['canView', 'View'],
                ['canAddTransactions', 'Transact'],
                ['canEditTransactions', 'Edit'],
                ['canDeleteTransactions', 'Delete'],
                ['canManageParticipants', 'Manage'],
              ] as const).map(([key, label]) => (
                <Pressable
                  key={key}
                  onPress={() => setInvitePerms((p) => ({ ...p, [key]: !p[key] }))}
                  style={[styles.permChip, invitePerms[key] ? styles.permChipOn : styles.permChipOff]}
                >
                  <Text style={[styles.permChipText, invitePerms[key] ? styles.permChipTextOn : styles.permChipTextOff]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {inviteError ? (
              <View style={styles.inviteFeedback}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.colors.danger} />
                <Text style={styles.inviteErrorText}>{inviteError}</Text>
              </View>
            ) : null}
            {inviteSuccess ? (
              <View style={styles.inviteFeedback}>
                <Ionicons name="checkmark-circle-outline" size={14} color={theme.colors.success} />
                <Text style={styles.inviteSuccessText}>{inviteSuccess}</Text>
              </View>
            ) : null}
            <PrimaryButton
              label="Send invitation"
              onPress={() => void handleSendInvite()}
              loading={inviteSending}
              disabled={!inviteEmail.trim()}
              compact
            />
          </View>
        </SectionCard>

        {/* Pending invitations */}
        {invitations.length > 0 ? (
          <SectionCard title="Pending invitations" subtitle="Waiting for the invitee to accept.">
            {invitations.map((inv) => (
              <View key={inv.id} style={styles.pendingInviteRow}>
                <View style={styles.pendingInviteIcon}>
                  <Ionicons name="mail-outline" size={16} color={theme.colors.accent} />
                </View>
                <View style={styles.pendingInviteInfo}>
                  <Text style={styles.pendingInviteEmail}>{inv.email}</Text>
                  <Text style={styles.pendingInviteExpiry}>
                    Expires {new Date(inv.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <Pressable onPress={() => void handleResendInvitation(inv.id, inv.email)} hitSlop={8} style={{ marginRight: 8 }}>
                  <Ionicons name="paper-plane-outline" size={20} color={theme.colors.accent} />
                </Pressable>
                <Pressable onPress={() => void handleCancelInvitation(inv.id, inv.email)} hitSlop={8}>
                  <Ionicons name="close-circle-outline" size={20} color={theme.colors.muted} />
                </Pressable>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* Participants list */}
        {isLoading && !refreshing ? (
          <View style={styles.skeletonList}>
            {[0, 1].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonLines}>
                  <View style={[styles.skeletonLine, { width: '50%' }]} />
                  <View style={[styles.skeletonLine, { width: '70%', marginTop: 6 }]} />
                </View>
              </View>
            ))}
          </View>
        ) : participants.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={32} color={theme.colors.muted} />
            <Text style={styles.emptyTitle}>No participants yet</Text>
            <Text style={styles.emptyBody}>
              Add participants to give others access to this account.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={styles.listCount}>
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'}
            </Text>
            {participants.map((participant) => (
              <ParticipantCard
                key={participant.id}
                participant={participant}
                onToggle={(key) => void handleToggle(participant, key)}
                onRemove={() => handleRemove(participant)}
                updating={
                  updating?.participantId === participant.id ? updating.key : null
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
  },
  errorCard: {
    alignItems: 'center',
    backgroundColor: '#fff0ef',
    borderColor: '#f5c6c4',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
  },
  errorText: {
    color: theme.colors.danger,
    flex: 1,
    fontSize: 14,
  },
  inviteForm: {
    gap: 12,
    marginTop: 10,
  },
  inviteInput: {
    backgroundColor: theme.colors.canvas,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 15,
    padding: 12,
  },
  invitePerms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  permChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  permChipOn: { backgroundColor: theme.colors.accent },
  permChipOff: { backgroundColor: theme.colors.canvas, borderColor: theme.colors.border, borderWidth: 1 },
  permChipText: { fontSize: 12, fontWeight: '700' },
  permChipTextOn: { color: '#fff' },
  permChipTextOff: { color: theme.colors.muted },
  inviteFeedback: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  inviteErrorText: { color: theme.colors.danger, fontSize: 13 },
  inviteSuccessText: { color: theme.colors.success, fontSize: 13, fontWeight: '600' },
  pendingInviteRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
  },
  pendingInviteIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pendingInviteInfo: { flex: 1 },
  pendingInviteEmail: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  pendingInviteExpiry: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  list: {
    gap: 12,
  },
  listCount: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cardHeaderPressed: {
    opacity: 0.7,
  },
  cardSummary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  cardSummaryText: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    flex: 1,
    gap: 3,
  },
  cardName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardEmail: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  permissions: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  permissionRow: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  permissionRowFirst: {
    borderTopWidth: 0,
  },
  removeRow: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: 'flex-start',
  },
  permissionInfo: {
    flex: 1,
    gap: 2,
  },
  permissionLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  permissionDesc: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 16,
  },
  skeletonAvatar: {
    backgroundColor: theme.colors.softForest,
    borderRadius: 14,
    height: 48,
    opacity: 0.5,
    width: 48,
  },
  skeletonLines: {
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    height: 12,
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
})

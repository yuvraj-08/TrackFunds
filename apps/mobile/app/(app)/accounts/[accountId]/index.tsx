import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { SectionCard } from '@/src/components/section-card'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type {
  AccountRecord,
  DebtRecord,
  OwnershipRecord,
  TransactionRecord,
} from '@/src/lib/api'

// ─── Sub-components ──────────────────────────────────────────────────────────

function PermissionPill({ label, granted }: { label: string; granted: boolean }) {
  return (
    <View style={[pillStyles.pill, granted ? pillStyles.granted : pillStyles.denied]}>
      <Ionicons
        name={granted ? 'checkmark' : 'close'}
        size={11}
        color={granted ? theme.colors.success : theme.colors.muted}
      />
      <Text style={[pillStyles.text, granted ? pillStyles.grantedText : pillStyles.deniedText]}>
        {label}
      </Text>
    </View>
  )
}

const pillStyles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  granted: { backgroundColor: '#e6f4ef' },
  denied: { backgroundColor: theme.colors.canvas },
  text: { fontSize: 12, fontWeight: '600' },
  grantedText: { color: theme.colors.success },
  deniedText: { color: theme.colors.muted },
})

function ParticipantRow({ participant }: { participant: AccountRecord['participants'][number] }) {
  const initials = participant.user.displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View style={participantStyles.row}>
      <View style={participantStyles.avatar}>
        <Text style={participantStyles.avatarText}>{initials}</Text>
      </View>
      <View style={participantStyles.info}>
        <Text style={participantStyles.name}>{participant.user.displayName}</Text>
        <Text style={participantStyles.email}>{participant.user.email}</Text>
        <View style={participantStyles.pills}>
          <PermissionPill label="View" granted={participant.canView} />
          <PermissionPill label="Transact" granted={participant.canAddTransactions} />
          <PermissionPill label="Manage" granted={participant.canManageParticipants} />
        </View>
      </View>
    </View>
  )
}

const participantStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    marginTop: 10,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  info: { flex: 1, gap: 4 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  email: { color: theme.colors.muted, fontSize: 13 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
})

function TransactionRow({
  accountId,
  transaction,
  onPress,
}: {
  accountId: string
  transaction: TransactionRecord
  onPress: () => void
}) {
  const isDeposit = transaction.type === 'DEPOSIT'
  const date = new Date(transaction.occurredAt)
  const dateStr = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [txStyles.row, pressed ? txStyles.pressed : null]}
    >
      <View style={[txStyles.icon, isDeposit ? txStyles.iconDeposit : txStyles.iconWithdrawal]}>
        <Ionicons
          name={isDeposit ? 'arrow-down' : 'arrow-up'}
          size={16}
          color={isDeposit ? theme.colors.success : theme.colors.accentWarm}
        />
      </View>
      <View style={txStyles.info}>
        <Text style={txStyles.label}>
          {isDeposit ? 'Deposit' : 'Withdrawal'}{' '}
          {transaction.note ? <Text style={txStyles.note}>· {transaction.note}</Text> : null}
        </Text>
        <Text style={txStyles.meta}>
          {transaction.owner.displayName} · {dateStr}
        </Text>
      </View>
      <Text style={[txStyles.amount, isDeposit ? txStyles.amountDeposit : txStyles.amountWithdrawal]}>
        {isDeposit ? '+' : '−'}{transaction.amount}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.border} />
    </Pressable>
  )
}

const txStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 14,
  },
  pressed: { opacity: 0.7 },
  icon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  iconDeposit: { backgroundColor: '#e6f4ef' },
  iconWithdrawal: { backgroundColor: '#fef0e6' },
  info: { flex: 1 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  note: { color: theme.colors.muted, fontWeight: '400' },
  meta: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800' },
  amountDeposit: { color: theme.colors.success },
  amountWithdrawal: { color: theme.colors.accentWarm },
})

function OwnershipRow({ item, currencyCode }: { item: OwnershipRecord; currencyCode: string }) {
  return (
    <View style={ownershipStyles.row}>
      <View style={ownershipStyles.avatar}>
        <Text style={ownershipStyles.avatarText}>
          {item.displayName
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? '')
            .join('')}
        </Text>
      </View>
      <Text style={ownershipStyles.name}>{item.displayName}</Text>
      <Text style={ownershipStyles.amount}>
        {currencyCode} {item.amount}
      </Text>
    </View>
  )
}

const ownershipStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatarText: { color: theme.colors.accent, fontSize: 12, fontWeight: '800' },
  name: { color: theme.colors.text, flex: 1, fontSize: 15, fontWeight: '600' },
  amount: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
})

function DebtRow({
  item,
  participants,
}: {
  item: DebtRecord
  participants: AccountRecord['participants']
}) {
  const spenderName =
    participants.find((p) => p.userId === item.spentByUserId)?.user.displayName ?? 'Unknown'

  return (
    <View style={debtStyles.row}>
      <View style={debtStyles.iconWrap}>
        <Ionicons name="swap-horizontal-outline" size={16} color={theme.colors.accentWarm} />
      </View>
      <View style={debtStyles.info}>
        <Text style={debtStyles.label}>
          <Text style={debtStyles.bold}>{spenderName}</Text>
          {' spent '}
          <Text style={debtStyles.bold}>{item.amount}</Text>
          {' for '}
          <Text style={debtStyles.bold}>{item.ownerDisplayName}</Text>
        </Text>
      </View>
    </View>
  )
}

const debtStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    borderTopColor: '#f5c6a0',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingTop: 12,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#fef0e6',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  info: { flex: 1 },
  label: { color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  bold: { color: theme.colors.text, fontWeight: '700' },
})

function SkeletonHero() {
  return (
    <View style={styles.hero}>
      <View style={skStyles.avatarLarge} />
      <View style={[skStyles.line, { width: '55%', height: 26 }]} />
      <View style={[skStyles.line, { width: '35%', height: 14, marginTop: 2 }]} />
    </View>
  )
}

const skStyles = StyleSheet.create({
  avatarLarge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    height: 60,
    width: 60,
  },
  line: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
  },
})

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AccountDetailScreen() {
  const router = useRouter()
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const { api, session } = useSession()
  const [account, setAccount] = useState<AccountRecord | null>(null)
  const [ownership, setOwnership] = useState<OwnershipRecord[]>([])
  const [debts, setDebts] = useState<DebtRecord[]>([])
  const [transactions, setTransactions] = useState<TransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!accountId) return

    try {
      setError(null)
      const [accountResult, ownershipResult, debtResult, transactionsResult] = await Promise.all([
        api.getAccount(accountId),
        api.getOwnership(accountId),
        api.getDebts(accountId),
        api.listTransactions(accountId),
      ])
      setAccount(accountResult)
      setOwnership(ownershipResult)
      setDebts(debtResult)
      setTransactions(transactionsResult)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load account.')
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

  const currentParticipant = useMemo(
    () => account?.participants.find((p) => p.userId === session?.user.id) ?? null,
    [account?.participants, session?.user.id],
  )

  const isOwner = account?.ownerUserId === session?.user.id

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
  }

  if (!accountId) return null

  const heroInitials = account
    ? account.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? '')
        .join('')
    : ''

  return (
    <AppScreen
      scrollable={false}
      title={account?.name ?? 'Account'}
      rightAction={
        isOwner ? (
          <PrimaryButton
            compact
            label="Edit"
            onPress={() => router.push(`/(app)/accounts/${accountId}/edit`)}
          />
        ) : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        {isLoading && !refreshing ? (
          <SkeletonHero />
        ) : (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{heroInitials}</Text>
              </View>
              <View style={styles.heroMeta}>
                <Text style={styles.heroName}>{account?.name}</Text>
                <View style={styles.heroBadges}>
                  {account?.currencyCode ? (
                    <View style={styles.heroBadge}>
                      <Text style={styles.heroBadgeText}>{account.currencyCode}</Text>
                    </View>
                  ) : null}
                  {account?.institution ? (
                    <View style={[styles.heroBadge, styles.heroBadgeMuted]}>
                      <Text style={styles.heroBadgeMutedText}>{account.institution}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.heroOwner}>
                  {isOwner ? 'Your account' : `Shared by ${account?.owner.displayName}`}
                  {' · '}
                  {account?.participants.length ?? 0} participants
                </Text>
                {!isOwner ? (
                  <View style={styles.sharedBadge}>
                    <Ionicons name="people-outline" size={11} color="rgba(245,241,232,0.7)" />
                    <Text style={styles.sharedBadgeText}>Shared with you</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {error ? (
              <View style={styles.heroError}>
                <Ionicons name="alert-circle-outline" size={14} color="#ffb3b3" />
                <Text style={styles.heroErrorText}>{error}</Text>
              </View>
            ) : null}

            {currentParticipant?.canAddTransactions ? (
              <View style={styles.heroActions}>
                <PrimaryButton
                  compact
                  label="Deposit"
                  onPress={() => router.push(`/(app)/accounts/${accountId}/transactions/deposit`)}
                />
                <PrimaryButton
                  compact
                  label="Withdrawal"
                  onPress={() =>
                    router.push(`/(app)/accounts/${accountId}/transactions/withdrawal`)
                  }
                  tone="warm"
                />
                {currentParticipant?.canManageParticipants ? (
                  <PrimaryButton
                    compact
                    label="Participants"
                    onPress={() => router.push(`/(app)/accounts/${accountId}/participants`)}
                    tone="ghost"
                  />
                ) : null}
              </View>
            ) : null}
          </View>
        )}

        {/* Permissions */}
        {currentParticipant ? (
          <SectionCard title="Your permissions" accent="forest">
            <View style={styles.permissionPills}>
              <PermissionPill label="View" granted={currentParticipant.canView} />
              <PermissionPill label="Add transactions" granted={currentParticipant.canAddTransactions} />
              <PermissionPill label="Edit transactions" granted={currentParticipant.canEditTransactions} />
              <PermissionPill label="Delete transactions" granted={currentParticipant.canDeleteTransactions} />
              <PermissionPill label="Manage participants" granted={currentParticipant.canManageParticipants} />
            </View>
          </SectionCard>
        ) : null}

        {/* Ownership */}
        <SectionCard
          title="Ownership"
          subtitle="Derived from the full transaction ledger."
          accent="forest"
        >
          {ownership.map((item) => (
            <OwnershipRow key={item.ownerUserId} item={item} currencyCode={account?.currencyCode ?? ''} />
          ))}
          {!isLoading && ownership.length === 0 ? (
            <Text style={styles.empty}>No ownership data yet.</Text>
          ) : null}
        </SectionCard>

        {/* Debts */}
        <SectionCard
          title="Debts"
          subtitle="Who spent money that belonged to someone else."
          accent="warm"
        >
          {debts.map((item) => (
            <DebtRow
              key={`${item.ownerUserId}-${item.spentByUserId}`}
              item={item}
              participants={account?.participants ?? []}
            />
          ))}
          {!isLoading && debts.length === 0 ? (
            <View style={styles.emptyPositive}>
              <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.success} />
              <Text style={styles.emptyPositiveText}>No outstanding debts.</Text>
            </View>
          ) : null}
        </SectionCard>

        {/* Participants */}
        <SectionCard title="Participants" subtitle="All members of this shared ledger.">
          {account?.participants.map((participant) => (
            <ParticipantRow key={participant.id} participant={participant} />
          ))}
        </SectionCard>

        {/* Transactions */}
        <SectionCard title="Transactions" subtitle="Latest ledger entries for this account.">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              accountId={accountId}
              transaction={transaction}
              onPress={() =>
                router.push(`/(app)/accounts/${accountId}/transactions/${transaction.id}`)
              }
            />
          ))}
          {!isLoading && transactions.length === 0 ? (
            <Text style={styles.empty}>No transactions recorded yet.</Text>
          ) : null}
        </SectionCard>
      </ScrollView>
    </AppScreen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 32,
  },
  hero: {
    backgroundColor: theme.colors.text,
    borderRadius: 24,
    gap: 16,
    padding: 20,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
  },
  heroAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  heroAvatarText: {
    color: '#f5f1e8',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroMeta: {
    flex: 1,
    gap: 6,
  },
  heroName: {
    color: '#f5f1e8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroBadgeText: {
    color: '#f5f1e8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBadgeMuted: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeMutedText: {
    color: 'rgba(245,241,232,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroOwner: {
    color: 'rgba(198,209,198,0.9)',
    fontSize: 13,
  },
  sharedBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sharedBadgeText: {
    color: 'rgba(245,241,232,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },
  heroError: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  heroErrorText: {
    color: '#ffb3b3',
    fontSize: 13,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  permissionPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  emptyPositive: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  emptyPositiveText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
    marginTop: 10,
  },
})

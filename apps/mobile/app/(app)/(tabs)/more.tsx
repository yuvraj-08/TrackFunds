import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
import type { AccountRecord } from '@/src/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type EnrichedDebt = {
  accountId: string
  accountName: string
  currencyCode: string
  rawAmount: number
  ownerUserId: string
  ownerDisplayName: string
  spentByUserId: string
  spentByDisplayName: string
}

type SplitPerson = {
  id: string
  name: string
}

// ─── Settle Up helpers ────────────────────────────────────────────────────────

function getDisplayName(userId: string, account: AccountRecord): string {
  if (userId === account.ownerUserId) return account.owner.displayName
  return account.participants.find((p) => p.userId === userId)?.user.displayName ?? 'Unknown'
}

async function loadAllDebts(
  accounts: AccountRecord[],
  getDebts: (id: string) => Promise<import('@/src/lib/api').DebtRecord[]>,
): Promise<EnrichedDebt[]> {
  const batches = await Promise.all(
    accounts.map((account) =>
      getDebts(account.id).then((debts) =>
        debts.map((d) => ({
          accountId: account.id,
          accountName: account.name,
          currencyCode: account.currencyCode,
          rawAmount: parseFloat(d.amount) || 0,
          ownerUserId: d.ownerUserId,
          ownerDisplayName: d.ownerDisplayName,
          spentByUserId: d.spentByUserId,
          spentByDisplayName: getDisplayName(d.spentByUserId, account),
        })),
      ),
    ),
  )
  return batches.flat()
}

// ─── Debt card ────────────────────────────────────────────────────────────────

function DebtCard({
  debt,
  currentUserId,
  onGoToAccount,
}: {
  debt: EnrichedDebt
  currentUserId: string
  onGoToAccount: () => void
}) {
  const youAreOwner = debt.ownerUserId === currentUserId
  // ownerUserId spent spentByUserId's money → owner owes spentBy
  const debtorName = youAreOwner ? 'You' : debt.ownerDisplayName
  const creditorName = debt.spentByUserId === currentUserId ? 'you' : debt.spentByDisplayName

  return (
    <View style={styles.debtCard}>
      <View style={styles.debtCardTop}>
        <View style={[styles.debtIcon, youAreOwner ? styles.debtIconYouOwe : styles.debtIconOwedToYou]}>
          <Ionicons
            name={youAreOwner ? 'arrow-up' : 'arrow-down'}
            size={16}
            color={youAreOwner ? theme.colors.accentWarm : theme.colors.success}
          />
        </View>
        <View style={styles.debtInfo}>
          <Text style={styles.debtSentence}>
            <Text style={styles.debtBold}>{debtorName}</Text>
            {' owe'}
            {debtorName === 'You' ? '' : 's'}
            {' '}
            <Text style={styles.debtBold}>{creditorName}</Text>
          </Text>
          <Text style={styles.debtAccount}>{debt.accountName}</Text>
        </View>
        <Text style={[styles.debtAmount, youAreOwner ? styles.debtAmountOwe : styles.debtAmountOwed]}>
          {debt.currencyCode} {debt.rawAmount.toFixed(2)}
        </Text>
      </View>
      <Pressable onPress={onGoToAccount} style={styles.debtAction}>
        <Text style={styles.debtActionText}>Go to account to record payment</Text>
        <Ionicons name="chevron-forward" size={13} color={theme.colors.accent} />
      </Pressable>
    </View>
  )
}

// ─── Split Calculator ─────────────────────────────────────────────────────────

function SplitCalculator() {
  const [amount, setAmount] = useState('')
  const [people, setPeople] = useState<SplitPerson[]>([
    { id: '1', name: 'You' },
    { id: '2', name: '' },
  ])
  const [nextId, setNextId] = useState(3)

  const parsedAmount = parseFloat(amount) || 0
  const filledPeople = people.filter((p) => p.name.trim().length > 0)
  const perPerson = filledPeople.length > 0 ? parsedAmount / filledPeople.length : 0

  const addPerson = () => {
    setPeople((prev) => [...prev, { id: String(nextId), name: '' }])
    setNextId((n) => n + 1)
  }

  const removePerson = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }

  const updateName = (id: string, name: string) => {
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)))
  }

  return (
    <View style={styles.splitCard}>
      <Text style={styles.splitTitle}>Split calculator</Text>
      <Text style={styles.splitSubtitle}>Divide a bill equally among any number of people.</Text>

      {/* Amount input */}
      <View style={styles.splitAmountRow}>
        <Text style={styles.splitCurrencySymbol}>₹</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={theme.colors.border}
          keyboardType="decimal-pad"
          style={styles.splitAmountInput}
        />
      </View>

      {/* People */}
      <View style={styles.splitPeopleList}>
        {people.map((person, index) => (
          <View key={person.id} style={styles.splitPersonRow}>
            <View style={styles.splitPersonAvatar}>
              <Text style={styles.splitPersonAvatarText}>
                {person.name.trim()[0]?.toUpperCase() ?? String(index + 1)}
              </Text>
            </View>
            <TextInput
              value={person.name}
              onChangeText={(v) => updateName(person.id, v)}
              placeholder={`Person ${index + 1}`}
              placeholderTextColor={theme.colors.border}
              style={styles.splitPersonInput}
            />
            {parsedAmount > 0 && person.name.trim().length > 0 ? (
              <Text style={styles.splitPersonShare}>
                ₹{perPerson.toFixed(2)}
              </Text>
            ) : null}
            {people.length > 2 ? (
              <Pressable onPress={() => removePerson(person.id)} style={styles.splitRemove} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={theme.colors.border} />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Pressable onPress={addPerson} style={styles.splitAddRow}>
        <Ionicons name="add-circle-outline" size={18} color={theme.colors.accent} />
        <Text style={styles.splitAddText}>Add person</Text>
      </Pressable>

      {/* Result */}
      {parsedAmount > 0 && filledPeople.length > 0 ? (
        <View style={styles.splitResult}>
          <Text style={styles.splitResultLabel}>
            {filledPeople.length} {filledPeople.length === 1 ? 'person' : 'people'} · each pays
          </Text>
          <Text style={styles.splitResultAmount}>₹{perPerson.toFixed(2)}</Text>
        </View>
      ) : null}
    </View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function BalanceScreen() {
  const router = useRouter()
  const { api, session } = useSession()
  const [debts, setDebts] = useState<EnrichedDebt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDebts = useCallback(async () => {
    try {
      setError(null)
      const accounts = await api.listAccounts()
      const enriched = await loadAllDebts(accounts, api.getDebts)
      setDebts(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load balances.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      void loadDebts()
    }, [loadDebts]),
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDebts()
  }

  const currentUserId = session?.user.id ?? ''

  const youOwe = debts.filter((d) => d.ownerUserId === currentUserId)
  const owedToYou = debts.filter((d) => d.spentByUserId === currentUserId)

  const totalOwed = owedToYou.reduce((s, d) => s + d.rawAmount, 0)
  const totalYouOwe = youOwe.reduce((s, d) => s + d.rawAmount, 0)

  return (
    <AppScreen scrollable={false} title="Balance">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Summary banner */}
          <View style={styles.summaryBanner}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryAmount} numberOfLines={1}>
                {totalOwed > 0 ? `₹${totalOwed.toFixed(2)}` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>Owed to you</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryBox}>
              <Text style={[styles.summaryAmount, totalYouOwe > 0 ? styles.summaryAmountOwe : null]} numberOfLines={1}>
                {totalYouOwe > 0 ? `₹${totalYouOwe.toFixed(2)}` : '—'}
              </Text>
              <Text style={styles.summaryLabel}>You owe</Text>
            </View>
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle-outline" size={18} color={theme.colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void loadDebts()}>
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : null}

          {/* Settle Up */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Settle up</Text>

            {isLoading && !refreshing ? (
              <View style={styles.skeletonList}>
                {[0, 1].map((i) => (
                  <View key={i} style={styles.skeletonCard}>
                    <View style={styles.skeletonIcon} />
                    <View style={styles.skeletonLines}>
                      <View style={[styles.skeletonLine, { width: '55%' }]} />
                      <View style={[styles.skeletonLine, { width: '35%', marginTop: 6 }]} />
                    </View>
                    <View style={[styles.skeletonLine, { width: 64, height: 18 }]} />
                  </View>
                ))}
              </View>
            ) : debts.length === 0 ? (
              <View style={styles.emptySettle}>
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.colors.success} />
                <Text style={styles.emptySettleTitle}>All clear</Text>
                <Text style={styles.emptySettleBody}>No outstanding debts across your accounts.</Text>
              </View>
            ) : (
              <View style={styles.debtList}>
                {owedToYou.length > 0 ? (
                  <>
                    <Text style={styles.debtGroupLabel}>Owed to you</Text>
                    {owedToYou.map((d, i) => (
                      <DebtCard
                        key={`${d.accountId}-${d.ownerUserId}-${i}`}
                        debt={d}
                        currentUserId={currentUserId}
                        onGoToAccount={() => router.push(`/(app)/accounts/${d.accountId}`)}
                      />
                    ))}
                  </>
                ) : null}
                {youOwe.length > 0 ? (
                  <>
                    <Text style={[styles.debtGroupLabel, { marginTop: owedToYou.length > 0 ? 16 : 0 }]}>
                      You owe
                    </Text>
                    {youOwe.map((d, i) => (
                      <DebtCard
                        key={`${d.accountId}-${d.ownerUserId}-${i}`}
                        debt={d}
                        currentUserId={currentUserId}
                        onGoToAccount={() => router.push(`/(app)/accounts/${d.accountId}`)}
                      />
                    ))}
                  </>
                ) : null}
              </View>
            )}
          </View>

          {/* Split Calculator */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Split calculator</Text>
            <SplitCalculator />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    gap: 24,
    paddingBottom: 40,
  },

  // Summary banner
  summaryBanner: {
    backgroundColor: theme.colors.text,
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingVertical: 22,
  },
  summaryBox: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  summaryDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 4,
    width: 1,
  },
  summaryAmount: {
    color: '#f5f1e8',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryAmountOwe: {
    color: '#ffb07a',
  },
  summaryLabel: {
    color: 'rgba(198,209,198,0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // Error
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
  errorText: { color: theme.colors.danger, flex: 1, fontSize: 14 },
  retryText: { color: theme.colors.accent, fontSize: 13, fontWeight: '700' },

  // Section
  section: { gap: 10 },
  sectionLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Debt list
  debtList: { gap: 10 },
  debtGroupLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  debtCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  debtCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  debtIcon: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  debtIconYouOwe: { backgroundColor: '#fef0e6' },
  debtIconOwedToYou: { backgroundColor: '#e6f4ef' },
  debtInfo: { flex: 1 },
  debtSentence: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
  debtBold: { fontWeight: '700' },
  debtAccount: { color: theme.colors.muted, fontSize: 12, marginTop: 2 },
  debtAmount: { fontSize: 15, fontWeight: '800' },
  debtAmountOwe: { color: theme.colors.accentWarm },
  debtAmountOwed: { color: theme.colors.success },
  debtAction: {
    alignItems: 'center',
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  debtActionText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },

  // Skeleton
  skeletonList: { gap: 10 },
  skeletonCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  skeletonIcon: {
    backgroundColor: theme.colors.softForest,
    borderRadius: 10,
    height: 36,
    opacity: 0.5,
    width: 36,
  },
  skeletonLines: { flex: 1 },
  skeletonLine: {
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    height: 12,
    opacity: 0.8,
  },

  // Empty settle
  emptySettle: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    paddingVertical: 32,
  },
  emptySettleTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  emptySettleBody: { color: theme.colors.muted, fontSize: 14, textAlign: 'center' },

  // Split calculator card
  splitCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  splitTitle: {
    color: theme.colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  splitSubtitle: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: -8,
  },
  splitAmountRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.canvas,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  splitCurrencySymbol: {
    color: theme.colors.muted,
    fontSize: 20,
    fontWeight: '700',
  },
  splitAmountInput: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    paddingVertical: 10,
  },
  splitPeopleList: { gap: 10 },
  splitPersonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  splitPersonAvatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  splitPersonAvatarText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  splitPersonInput: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 8,
  },
  splitPersonShare: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 72,
    textAlign: 'right',
  },
  splitRemove: {
    padding: 2,
  },
  splitAddRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  splitAddText: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  splitResult: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  splitResultLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  splitResultAmount: {
    color: theme.colors.accent,
    fontSize: 22,
    fontWeight: '900',
  },
})

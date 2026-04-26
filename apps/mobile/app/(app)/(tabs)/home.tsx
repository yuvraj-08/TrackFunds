import { useFocusEffect, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { SectionCard } from '@/src/components/section-card'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type { AccountRecord, DebtRecord, TransactionRecord } from '@/src/lib/api'

type HomeStats = {
  accountCount: number
  debtCount: number
  participantCount: number
  transactionCountLast30Days: number
}

const defaultHomeStats: HomeStats = {
  accountCount: 0,
  debtCount: 0,
  participantCount: 0,
  transactionCountLast30Days: 0,
}

export default function HomeScreen() {
  const router = useRouter()
  const { api, session } = useSession()
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [stats, setStats] = useState<HomeStats>(defaultHomeStats)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadHomeData = useCallback(async () => {
    try {
      setError(null)
      const nextAccounts = await api.listAccounts()
      setAccounts(nextAccounts)

      const accountIds = nextAccounts.map((account) => account.id)
      const [transactionBatches, debtBatches] = await Promise.all([
        Promise.all(accountIds.map((accountId) => api.listTransactions(accountId))),
        Promise.all(accountIds.map((accountId) => api.getDebts(accountId))),
      ])

      const allTransactions = transactionBatches.flat()
      const allDebts = debtBatches.flat()
      const nextStats = computeHomeStats(nextAccounts, allTransactions, allDebts)
      setStats(nextStats)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load home stats.')
      setAccounts([])
      setStats(defaultHomeStats)
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      void loadHomeData()
    }, [loadHomeData]),
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadHomeData()
  }

  const statCards = useMemo(
    () => [
      {
        icon: 'wallet-outline' as const,
        label: 'Accounts',
        tone: 'blue' as const,
        value: stats.accountCount.toString(),
      },
      {
        icon: 'people-outline' as const,
        label: 'Participants',
        tone: 'lavender' as const,
        value: stats.participantCount.toString(),
      },
      {
        icon: 'swap-horizontal-outline' as const,
        label: 'Entries (30d)',
        tone: 'warm' as const,
        value: stats.transactionCountLast30Days.toString(),
      },
      {
        icon: 'receipt-outline' as const,
        label: 'Open debts',
        tone: 'sand' as const,
        value: stats.debtCount.toString(),
      },
    ],
    [stats],
  )

  const ownedAccountsCount = useMemo(
    () => accounts.filter((account) => account.ownerUserId === session?.user.id).length,
    [accounts, session?.user.id],
  )
  const sharedAccountsCount = Math.max(accounts.length - ownedAccountsCount, 0)
  const hasAccounts = accounts.length > 0

  return (
    <AppScreen
      title={`Hi, ${session?.user.displayName ?? 'there'}`}
      subtitle="A cleaner view of your accounts, collaborators, and current activity."
    >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stack}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowPrimary} pointerEvents="none" />
            <View style={styles.heroGlowWarm} pointerEvents="none" />
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <View style={styles.heroBadgeDot} />
                <Text style={styles.heroBadgeText}>Today&apos;s overview</Text>
              </View>
              <Text style={styles.heroDateLabel}>TrackFunds</Text>
            </View>
            <Text style={styles.heroTitle}>
              {hasAccounts
                ? `${stats.transactionCountLast30Days} recent entries across your ledger`
                : 'Set up your first shared account'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {hasAccounts
                ? `You are tracking ${accounts.length} account${accounts.length === 1 ? '' : 's'} with ${stats.participantCount} participant${stats.participantCount === 1 ? '' : 's'}.`
                : 'Create an account to start recording deposits, withdrawals, balances, and shared ownership.'}
            </Text>
            <View style={styles.heroMetricsRow}>
              <View style={styles.heroMetricPill}>
                <Text style={styles.heroMetricValue}>{ownedAccountsCount}</Text>
                <Text style={styles.heroMetricLabel}>Owned</Text>
              </View>
              <View style={styles.heroMetricPill}>
                <Text style={styles.heroMetricValue}>{sharedAccountsCount}</Text>
                <Text style={styles.heroMetricLabel}>Shared</Text>
              </View>
              <View style={styles.heroMetricPill}>
                <Text style={styles.heroMetricValue}>{stats.debtCount}</Text>
                <Text style={styles.heroMetricLabel}>Open debts</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <PrimaryButton
                compact
                label="New account"
                onPress={() => router.push('/(app)/accounts/create')}
              />
              <PrimaryButton
                compact
                label={hasAccounts ? 'Open accounts' : 'Browse accounts'}
                onPress={() => router.push('/(app)/(tabs)/accounts' as never)}
                tone="ghost"
              />
            </View>
          </View>

          <SectionCard title="Portfolio snapshot" subtitle="Live counts pulled from your current visible accounts.">
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.statsGrid}>
              {statCards.map((card) => (
                <View key={card.label} style={[styles.statCard, statToneStyles[card.tone]]}>
                  <View style={styles.statIconWrap}>
                    <Ionicons color={theme.colors.text} name={card.icon} size={18} />
                  </View>
                  <Text style={styles.statValue}>{isLoading ? '...' : card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>
          </SectionCard>

          <SectionCard
            accent={hasAccounts ? 'default' : 'warm'}
            title={hasAccounts ? 'Keep things moving' : 'No accounts yet'}
            subtitle={
              hasAccounts
                ? 'Jump to the accounts tab for details, balances, and participant activity.'
                : 'Start with one account and expand from there.'
            }
          >
            {hasAccounts ? (
              <View style={styles.focusList}>
                <View style={styles.focusRow}>
                  <View style={styles.focusIconWrap}>
                    <Ionicons color={theme.colors.accent} name="wallet-outline" size={18} />
                  </View>
                  <View style={styles.focusTextWrap}>
                    <Text style={styles.focusTitle}>Manage accounts in one place</Text>
                    <Text style={styles.focusCopy}>
                      Open the Accounts tab to view every ledger, participant, and account detail.
                    </Text>
                  </View>
                </View>
                <View style={styles.focusRow}>
                  <View style={styles.focusIconWrap}>
                    <Ionicons color={theme.colors.accentWarm} name="person-outline" size={18} />
                  </View>
                  <View style={styles.focusTextWrap}>
                    <Text style={styles.focusTitle}>Review your profile settings</Text>
                    <Text style={styles.focusCopy}>
                      Use Profile for identity details, session controls, and security actions.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons color={theme.colors.accentWarm} name="wallet-outline" size={24} />
                <Text style={styles.emptyTitle}>Create your first ledger</Text>
                <Text style={styles.emptyCopy}>
                  Start with one account, then add participants and transactions when you are
                  ready.
                </Text>
              </View>
            )}
          </SectionCard>
        </View>
      </ScrollView>
    </AppScreen>
  )
}

function computeHomeStats(
  accounts: AccountRecord[],
  transactions: TransactionRecord[],
  debts: DebtRecord[],
): HomeStats {
  const participantIds = new Set<string>()

  for (const account of accounts) {
    for (const participant of account.participants) {
      participantIds.add(participant.userId)
    }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const transactionCountLast30Days = transactions.filter(
    (transaction) => new Date(transaction.occurredAt) >= thirtyDaysAgo,
  ).length

  return {
    accountCount: accounts.length,
    debtCount: debts.length,
    participantCount: participantIds.size,
    transactionCountLast30Days,
  }
}

const styles = StyleSheet.create({
  stack: {
    gap: 18,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#17233f',
    borderRadius: 30,
    overflow: 'hidden',
    padding: 20,
    position: 'relative',
    shadowColor: '#0b1222',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  heroGlowPrimary: {
    backgroundColor: 'rgba(126,166,255,0.16)',
    borderRadius: 999,
    height: 180,
    position: 'absolute',
    right: -36,
    top: -40,
    width: 180,
  },
  heroGlowWarm: {
    backgroundColor: 'rgba(208,107,67,0.18)',
    borderRadius: 999,
    bottom: -70,
    height: 170,
    position: 'absolute',
    right: 20,
    width: 170,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroBadgeDot: {
    backgroundColor: '#7ea6ff',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  heroBadgeText: {
    color: '#eef4ff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroDateLabel: {
    color: '#aebee9',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#f7f9ff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  heroSubtitle: {
    color: '#d3dcf4',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  heroMetricPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroMetricValue: {
    color: '#f7f9ff',
    fontSize: 20,
    fontWeight: '900',
  },
  heroMetricLabel: {
    color: '#b9c7ea',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  error: {
    color: theme.colors.danger,
    marginBottom: 10,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    minWidth: '47%',
    padding: 15,
  },
  statIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 999,
    height: 34,
    justifyContent: 'center',
    marginBottom: 16,
    width: 34,
  },
  statValue: {
    color: theme.colors.accent,
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: theme.colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  focusList: {
    gap: 14,
  },
  focusRow: {
    flexDirection: 'row',
    gap: 12,
  },
  focusIconWrap: {
    alignItems: 'center',
    backgroundColor: '#f5ede3',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  focusTextWrap: {
    flex: 1,
    gap: 4,
  },
  focusTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  focusCopy: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'flex-start',
    gap: 8,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCopy: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
})

const statToneStyles = StyleSheet.create({
  blue: {
    backgroundColor: '#eef3ff',
  },
  lavender: {
    backgroundColor: '#f1efff',
  },
  sand: {
    backgroundColor: '#f8efe4',
  },
  warm: {
    backgroundColor: '#fff0e7',
  },
})

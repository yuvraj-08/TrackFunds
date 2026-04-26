import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'


import { AccountCard } from '@/src/components/account-card'
import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

import type { AccountRecord } from '@/src/lib/api'

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '60%' }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '30%', marginTop: 6 }]} />
      </View>
    </View>
  )
}

export function AccountsScreen() {
  const router = useRouter()
  const { api, session } = useSession()
  const [accounts, setAccounts] = useState<AccountRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAccounts = useCallback(async () => {
    try {
      setError(null)
      const result = await api.listAccounts()
      setAccounts(result)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load accounts.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [api])

  useFocusEffect(
    useCallback(() => {
      void loadAccounts()
    }, [loadAccounts]),
  )

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAccounts()
  }

  return (
    <AppScreen
      scrollable={false}
      title="Accounts"
      subtitle="Shared ledgers you can view and act on."
      rightAction={
        <PrimaryButton
          compact
          label="New account"
          onPress={() => router.push('/(app)/accounts/create')}
        />
      }
    >
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => void loadAccounts()} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {isLoading && !refreshing ? (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : (
          <View style={styles.list}>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                currentUserId={session?.user.id}
                onPress={() => router.push(`/(app)/accounts/${account.id}`)}
              />
            ))}
          </View>
        )}

        {!isLoading && !error && accounts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="wallet-outline" size={36} color={theme.colors.accent} />
            </View>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyBody}>
              Create a shared account, then invite participants and record deposits or withdrawals.
            </Text>
            <PrimaryButton
              label="Create your first account"
              onPress={() => router.push('/(app)/accounts/create')}
            />
          </View>
        ) : null}

        {!isLoading && accounts.length > 0 ? (
          <Text style={styles.countHint}>
            {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.push('/(app)/invitations/redeem')}
          style={({ pressed }) => [styles.redeemRow, pressed ? styles.redeemRowPressed : null]}
        >
          <Ionicons name="ticket-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.redeemText}>Have an invite code? Redeem it here</Text>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.border} />
        </Pressable>
      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 32,
    gap: 20,
  },
  list: {
    gap: 12,
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
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 4,
  },
  retryText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
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
    opacity: 0.6,
    width: 48,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    height: 12,
    opacity: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 24,
    height: 72,
    justifyContent: 'center',
    marginBottom: 4,
    width: 72,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyBody: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  countHint: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  redeemRow: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  redeemRowPressed: { opacity: 0.7 },
  redeemText: {
    color: theme.colors.accent,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
})

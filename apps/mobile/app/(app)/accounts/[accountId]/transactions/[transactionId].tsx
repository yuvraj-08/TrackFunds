import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { ChoiceList } from '@/src/components/choice-list'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { SectionCard } from '@/src/components/section-card'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type { AccountParticipantRecord, AccountRecord, TransactionRecord } from '@/src/lib/api'

export default function TransactionEditScreen() {
  const router = useRouter()
  const { accountId, transactionId } = useLocalSearchParams<{
    accountId: string
    transactionId: string
  }>()
  const { api, session } = useSession()
  const [account, setAccount] = useState<AccountRecord | null>(null)
  const [participants, setParticipants] = useState<AccountParticipantRecord[]>([])
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null)
  const [amount, setAmount] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [spentByUserId, setSpentByUserId] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const participantChoices = useMemo(
    () =>
      participants.map((participant) => ({
        description: participant.user.email,
        label: participant.user.displayName,
        value: participant.userId,
      })),
    [participants],
  )

  const currentParticipant = useMemo(() => {
    return account?.participants.find((participant) => participant.userId === session?.user.id) ?? null
  }, [account?.participants, session?.user.id])

  const canEditTransaction = currentParticipant?.canEditTransactions ?? false
  const canDeleteTransaction = currentParticipant?.canDeleteTransactions ?? false
  const isDeposit = transaction?.type === 'DEPOSIT'

  const loadData = useCallback(async () => {
    if (!accountId || !transactionId) {
      return
    }

    try {
      setError(null)
      const [accountResult, participantResult, transactionResult] = await Promise.all([
        api.getAccount(accountId),
        api.listParticipants(accountId),
        api.getTransaction(accountId, transactionId),
      ])

      setAccount(accountResult)
      setParticipants(participantResult)
      setTransaction(transactionResult)
      setAmount(transactionResult.amount)
      setOwnerUserId(transactionResult.ownerUserId)
      setSpentByUserId(transactionResult.spentByUserId)
      setNote(transactionResult.note ?? '')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load transaction.')
    }
  }, [accountId, api, transactionId])

  useFocusEffect(
    useCallback(() => {
      void loadData()
    }, [loadData]),
  )

  const handleSave = async () => {
    if (!accountId || !transactionId || !transaction || !canEditTransaction) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await api.updateTransaction(accountId, transactionId, {
        amount,
        note: note || undefined,
        ownerUserId,
        spentByUserId: isDeposit ? ownerUserId : spentByUserId,
      })
      router.replace(`/(app)/accounts/${accountId}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update transaction.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    if (!accountId || !transactionId || !canDeleteTransaction) {
      return
    }

    Alert.alert('Delete transaction?', 'This entry will be removed from the shared ledger.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: async () => {
          setIsDeleting(true)

          try {
            await api.deleteTransaction(accountId, transactionId)
            router.replace(`/(app)/accounts/${accountId}`)
          } catch (requestError) {
            setError(
              requestError instanceof Error ? requestError.message : 'Could not delete transaction.',
            )
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ])
  }

  return (
    <AppScreen
      title={isDeposit ? 'Edit deposit' : 'Edit withdrawal'}
      subtitle="Adjust the ledger entry only when your current account permissions allow it."
    >
      <SectionCard title="Transaction details" subtitle="Source and recorded-at values stay read-only for now.">
        <View style={styles.summaryList}>
          <Text style={styles.summaryLine}>Type: {transaction?.type ?? 'Loading...'}</Text>
          <Text style={styles.summaryLine}>Source: {transaction?.source ?? 'Loading...'}</Text>
          <Text style={styles.summaryLine}>
            Recorded: {transaction ? new Date(transaction.createdAt).toLocaleString() : 'Loading...'}
          </Text>
        </View>
      </SectionCard>

      <View style={styles.form}>
        <FormField
          keyboardType="decimal-pad"
          label="Amount"
          placeholder="450.00"
          value={amount}
          onChangeText={setAmount}
        />
        <ChoiceList
          label={isDeposit ? 'Deposit belongs to' : 'Money belongs to'}
          options={participantChoices}
          value={ownerUserId}
          onChange={(value) => {
            setOwnerUserId(value)
            if (isDeposit) {
              setSpentByUserId(value)
            }
          }}
        />
        {!isDeposit ? (
          <ChoiceList
            label="Money was spent by"
            options={participantChoices}
            value={spentByUserId}
            onChange={setSpentByUserId}
          />
        ) : null}
        <FormField
          label="Note"
          multiline
          placeholder="Optional note for context"
          value={note}
          onChangeText={setNote}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!canEditTransaction && !canDeleteTransaction ? (
          <Text style={styles.helper}>
            You can view this transaction, but edit and delete actions are hidden because your
            current permissions do not allow them.
          </Text>
        ) : null}
        {canEditTransaction ? (
          <PrimaryButton
            label={isSubmitting ? 'Saving changes...' : 'Save changes'}
            onPress={handleSave}
          />
        ) : null}
        {canDeleteTransaction ? (
          <PrimaryButton
            label={isDeleting ? 'Deleting transaction...' : 'Delete transaction'}
            onPress={handleDelete}
            tone="danger"
          />
        ) : null}
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  summaryList: {
    gap: 8,
  },
  summaryLine: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  helper: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: theme.colors.danger,
  },
})

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { ChoiceList } from '@/src/components/choice-list'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'
import type { AccountParticipantRecord } from '@/src/lib/api'

export default function WithdrawalTransactionScreen() {
  const router = useRouter()
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const { api } = useSession()
  const [participants, setParticipants] = useState<AccountParticipantRecord[]>([])
  const [ownerUserId, setOwnerUserId] = useState('')
  const [spentByUserId, setSpentByUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const participantChoices = useMemo(
    () =>
      participants.map((participant) => ({
        description: participant.user.email,
        label: participant.user.displayName,
        value: participant.userId,
      })),
    [participants],
  )

  useFocusEffect(
    useCallback(() => {
      if (!accountId) {
        return
      }

      void api.listParticipants(accountId).then((result) => {
        setParticipants(result)
        if (result[0]) {
          if (!ownerUserId) {
            setOwnerUserId(result[0].userId)
          }
          if (!spentByUserId) {
            setSpentByUserId(result[0].userId)
          }
        }
      })
    }, [accountId, api, ownerUserId, spentByUserId]),
  )

  const handleSubmit = async () => {
    if (!accountId) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await api.createTransaction(accountId, {
        amount,
        note: note || undefined,
        occurredAt: new Date().toISOString(),
        ownerUserId,
        source: 'MANUAL',
        spentByUserId,
        type: 'WITHDRAWAL',
      })
      router.replace(`/(app)/accounts/${accountId}`)
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Could not create withdrawal.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppScreen
      title="Add withdrawal"
      subtitle="Record whose balance paid for the withdrawal and who actually spent the money."
    >
      <View style={styles.form}>
        <FormField
          keyboardType="decimal-pad"
          label="Amount"
          placeholder="450.00"
          value={amount}
          onChangeText={setAmount}
        />
        <ChoiceList
          label="Money belongs to"
          options={participantChoices}
          value={ownerUserId}
          onChange={setOwnerUserId}
        />
        <ChoiceList
          label="Money was spent by"
          options={participantChoices}
          value={spentByUserId}
          onChange={setSpentByUserId}
        />
        <FormField
          label="Note"
          multiline
          placeholder="Groceries, transfer, ATM withdrawal..."
          value={note}
          onChangeText={setNote}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Saving withdrawal...' : 'Record withdrawal'}
          onPress={handleSubmit}
        />
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  error: {
    color: theme.colors.danger,
  },
})

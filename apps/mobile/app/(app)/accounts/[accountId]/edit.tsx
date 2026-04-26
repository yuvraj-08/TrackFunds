import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function EditAccountScreen() {
  const router = useRouter()
  const { accountId } = useLocalSearchParams<{ accountId: string }>()
  const { api } = useSession()
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [currencyCode, setCurrencyCode] = useState('INR')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadAccount = useCallback(async () => {
    if (!accountId) {
      return
    }

    try {
      const account = await api.getAccount(accountId)
      setName(account.name)
      setInstitution(account.institution ?? '')
      setCurrencyCode(account.currencyCode)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load account.')
    }
  }, [accountId, api])

  useFocusEffect(
    useCallback(() => {
      void loadAccount()
    }, [loadAccount]),
  )

  const handleSave = async () => {
    if (!accountId) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await api.updateAccount(accountId, {
        name,
        institution: institution || undefined,
        currencyCode,
      })
      router.replace(`/(app)/accounts/${accountId}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete account?', 'This removes the account and all related ledger data.', [
      { style: 'cancel', text: 'Cancel' },
      {
        style: 'destructive',
        text: 'Delete',
        onPress: async () => {
          if (!accountId) {
            return
          }

          setIsDeleting(true)

          try {
            await api.deleteAccount(accountId)
            router.replace('/(app)/accounts')
          } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'Could not delete account.')
          } finally {
            setIsDeleting(false)
          }
        },
      },
    ])
  }

  return (
    <AppScreen title="Edit account" subtitle="Only the account owner can change or delete this account.">
      <View style={styles.form}>
        <FormField label="Account name" value={name} onChangeText={setName} />
        <FormField label="Institution" value={institution} onChangeText={setInstitution} />
        <FormField
          autoCapitalize="characters"
          label="Currency code"
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label={isSubmitting ? 'Saving...' : 'Save changes'} onPress={handleSave} />
        <PrimaryButton
          label={isDeleting ? 'Deleting...' : 'Delete account'}
          onPress={handleDelete}
          tone="danger"
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

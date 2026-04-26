import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function CreateAccountScreen() {
  const router = useRouter()
  const { api } = useSession()
  const [name, setName] = useState('')
  const [institution, setInstitution] = useState('')
  const [currencyCode, setCurrencyCode] = useState('INR')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const account = await api.createAccount({
        name,
        institution: institution || undefined,
        currencyCode,
      })
      router.replace(`/(app)/accounts/${account.id}`)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create account.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppScreen title="Create account" subtitle="This user becomes the account owner.">
      <View style={styles.form}>
        <FormField label="Account name" placeholder="Shared Savings" value={name} onChangeText={setName} />
        <FormField
          label="Institution"
          placeholder="State Bank of India"
          value={institution}
          onChangeText={setInstitution}
        />
        <FormField
          autoCapitalize="characters"
          label="Currency code"
          placeholder="INR"
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Creating...' : 'Create account'}
          loading={isSubmitting}
          onPress={handleSubmit}
          disabled={!name || !currencyCode}
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

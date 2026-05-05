import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { AuthShell } from '@/src/components/auth-shell'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { resetPassword } = useSession()
  const params = useLocalSearchParams<{ token?: string }>()
  const [token, setToken] = useState(params.token ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const result = await resetPassword({ token, newPassword })
      setMessage(result.message)
      setTimeout(() => {
        router.replace('/(auth)/login')
      }, 900)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Reset failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Set a new password"
      title="Complete the reset"
      subtitle={
        params.token
          ? 'Your reset token has been filled in. Just set a new password below.'
          : 'Paste the reset token from the email and choose a new password.'
      }
    >
      <View style={styles.form}>
        <FormField
          autoCapitalize="none"
          label="Reset token"
          multiline
          placeholder="Paste the token you received"
          value={token}
          onChangeText={setToken}
        />
        <FormField
          label="New password"
          placeholder="At least 8 characters"
          allowPasswordToggle
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Updating...' : 'Reset password'}
          loading={isSubmitting}
          onPress={handleSubmit}
          disabled={!token || !newPassword}
        />
        <Link href="/(auth)/login" style={styles.link}>
          Back to sign in
        </Link>
      </View>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  message: {
    color: theme.colors.success,
    fontSize: 14,
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
  link: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
})

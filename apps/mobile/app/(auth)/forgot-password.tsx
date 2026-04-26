import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { AuthShell } from '@/src/components/auth-shell'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function ForgotPasswordScreen() {
  const { requestPasswordReset } = useSession()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      const result = await requestPasswordReset(email)
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Reset access"
      title="Forgot your password?"
      subtitle="Enter your email. The backend will send reset instructions. In-app reset currently expects the reset token from email."
    >
      <View style={styles.form}>
        <Link asChild href="/(auth)/login" replace>
          <Pressable style={styles.backButton}>
            <Ionicons color={theme.colors.text} name="arrow-back" size={18} />
            <Text style={styles.backLabel}>Back to sign in</Text>
          </Pressable>
        </Link>
        <FormField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        {message ? <Text style={styles.message}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Sending...' : 'Send reset email'}
          loading={isSubmitting}
          onPress={handleSubmit}
          disabled={!email}
        />
        <Link href="/(auth)/reset-password" style={styles.link}>
          Already have the reset token?
        </Link>
      </View>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 2,
  },
  backLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
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

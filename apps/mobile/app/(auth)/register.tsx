import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'

import { AuthShell } from '@/src/components/auth-shell'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function RegisterScreen() {
  const router = useRouter()
  const { signUp } = useSession()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await signUp({ displayName, email, password })
      router.replace('/(app)/(tabs)/home' as never)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registration failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Start clean"
      title="Create your TrackFunds account"
      subtitle="V1 uses email and password only. You can invite other participants after account creation."
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}
      >
        <FormField
          label="Display name"
          placeholder="John Doe"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <FormField
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
        />
        <FormField
          label="Password"
          placeholder="At least 8 characters"
          allowPasswordToggle
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Creating account...' : 'Create account'}
          loading={isSubmitting}
          onPress={handleSubmit}
          disabled={!displayName || !email || !password}
        />
        <View style={styles.row}>
          <Text style={styles.helper}>Already have an account?</Text>
          <Link dismissTo href="/(auth)/login" replace style={styles.link}>
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  helper: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  link: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
  },
})

import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'

import { AuthShell } from '@/src/components/auth-shell'
import { FormField } from '@/src/components/form-field'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      await signIn({ email, password })
      router.replace('/(app)/(tabs)/home' as never)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Track every rupee clearly"
      title="Welcome back"
      subtitle="Sign in to your workspace and pick up your shared budgets, balances, and recent activity."
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.form}
      >
        <View style={styles.headerBlock}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusLabel}>Secure email sign-in</Text>
          </View>
          <Text style={styles.formTitle}>Access your account</Text>
          <Text style={styles.formSubtitle}>
            Keep your household ledger, account insights, and shared planning in one place.
          </Text>
        </View>
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
          placeholder="Your password"
          allowPasswordToggle
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={styles.passwordMetaRow}>
          <Link href="/(auth)/forgot-password" style={styles.inlineLink}>
            Forgot password?
          </Link>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          label={isSubmitting ? 'Signing in...' : 'Sign in'}
          loading={isSubmitting}
          onPress={handleSubmit}
          disabled={!email || !password}
        />
        <View style={styles.row}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link dismissTo href="/(auth)/register" replace style={styles.link}>
            Create one
          </Link>
        </View>
        <View style={styles.assuranceRow}>
          <View style={styles.assuranceItem}>
            <Ionicons color={theme.colors.accent} name="shield-checkmark-outline" size={16} />
            <Text style={styles.assuranceText}>Protected session</Text>
          </View>
          <View style={styles.assuranceItem}>
            <Ionicons color={theme.colors.accentWarm} name="pulse-outline" size={16} />
            <Text style={styles.assuranceText}>Fast resume</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AuthShell>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 4,
  },
  statusPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#eef3ff',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: theme.colors.success,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  statusLabel: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  formTitle: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  formSubtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  passwordMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: -4,
  },
  helper: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  inlineLink: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 18,
    justifyContent: 'center',
    paddingTop: 8,
  },
  footerText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  link: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  assuranceRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  assuranceItem: {
    alignItems: 'center',
    backgroundColor: '#f7efe6',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  assuranceText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
})

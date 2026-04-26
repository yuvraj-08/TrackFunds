import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'

import { AppScreen } from '@/src/components/app-screen'
import { PrimaryButton } from '@/src/components/primary-button'
import { theme } from '@/src/constants/theme'
import { useSession } from '@/src/hooks/use-session'

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuRow({
  icon,
  label,
  onPress,
  tone = 'default',
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  tone?: 'default' | 'danger'
}) {
  return (
    <View style={styles.menuRow}>
      <View style={[styles.menuIcon, tone === 'danger' ? styles.menuIconDanger : null]}>
        <Ionicons
          name={icon}
          size={18}
          color={tone === 'danger' ? theme.colors.danger : theme.colors.accent}
        />
      </View>
      <Text
        style={[styles.menuLabel, tone === 'danger' ? styles.menuLabelDanger : null]}
        onPress={onPress}
      >
        {label}
      </Text>
      {tone !== 'danger' ? (
        <Ionicons name="chevron-forward" size={16} color={theme.colors.border} />
      ) : null}
    </View>
  )
}

export default function ProfileScreen() {
  const router = useRouter()
  const { api, session, signOut, signOutEverywhere } = useSession()
  const [stats, setStats] = useState({ owned: 0, shared: 0 })

  const loadStats = useCallback(async () => {
    try {
      const accounts = await api.listAccounts()
      const owned = accounts.filter((a) => a.ownerUserId === session?.user.id).length
      setStats({ owned, shared: Math.max(accounts.length - owned, 0) })
    } catch {
      // silently keep zeros
    }
  }, [api, session?.user.id])

  useFocusEffect(
    useCallback(() => {
      void loadStats()
    }, [loadStats]),
  )

  const handleSignOutEverywhere = () => {
    Alert.alert(
      'Sign out everywhere?',
      'This will invalidate all active sessions across all devices.',
      [
        { style: 'cancel', text: 'Cancel' },
        { style: 'destructive', text: 'Sign out everywhere', onPress: () => void signOutEverywhere() },
      ],
    )
  }

  const displayName = session?.user.displayName ?? 'TrackFunds user'
  const email = session?.user.email ?? ''

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <AppScreen scrollable={false} title="Profile">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Identity hero */}
        <View style={styles.hero}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>{initials}</Text>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <View style={styles.heroBadge}>
            <Ionicons name="mail-outline" size={13} color="rgba(245,241,232,0.6)" />
            <Text style={styles.heroBadgeText}>{email}</Text>
          </View>

          <View style={styles.statsRow}>
            <StatBox label="Owned" value={stats.owned} />
            <View style={styles.statDivider} />
            <StatBox label="Shared" value={stats.shared} />
            <View style={styles.statDivider} />
            <StatBox label="Total" value={stats.owned + stats.shared} />
          </View>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="shield-checkmark-outline"
              label="App Lock"
              onPress={() => router.push('/(app)/lock-settings')}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="lock-closed-outline"
              label="Reset password"
              onPress={() => router.push('/(auth)/forgot-password')}
            />
          </View>
        </View>

        {/* Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <View style={styles.menuCard}>
            <MenuRow
              icon="log-out-outline"
              label="Sign out"
              onPress={() => void signOut()}
            />
            <View style={styles.menuDivider} />
            <MenuRow
              icon="phone-portrait-outline"
              label="Sign out everywhere"
              onPress={handleSignOutEverywhere}
              tone="danger"
            />
          </View>
        </View>

      </ScrollView>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 24,
    paddingBottom: 32,
  },

  // Hero
  hero: {
    alignItems: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: 28,
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  heroAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    height: 80,
    justifyContent: 'center',
    marginBottom: 4,
    width: 80,
  },
  heroAvatarText: {
    color: '#f5f1e8',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  heroName: {
    color: '#f5f1e8',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  heroBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  heroBadgeText: {
    color: 'rgba(245,241,232,0.6)',
    fontSize: 13,
  },
  statsRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    width: '100%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  statValue: {
    color: '#f5f1e8',
    fontSize: 26,
    fontWeight: '900',
  },
  statLabel: {
    color: 'rgba(198,209,198,0.85)',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    height: 36,
    width: 1,
  },

  // Sections
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  menuIconDanger: {
    backgroundColor: '#fff0ef',
  },
  menuLabel: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  menuLabelDanger: {
    color: theme.colors.danger,
  },
  menuDivider: {
    backgroundColor: theme.colors.border,
    height: 1,
    marginLeft: 64,
  },
})

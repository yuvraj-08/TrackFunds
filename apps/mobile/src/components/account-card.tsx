import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { theme } from '@/src/constants/theme'
import type { AccountRecord } from '@/src/lib/api'

function AccountAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  )
}

export function AccountCard({
  account,
  currentUserId,
  onPress,
}: {
  account: AccountRecord
  currentUserId?: string
  onPress: () => void
}) {
  const participantCount = account.participants.length
  const isShared = currentUserId ? account.ownerUserId !== currentUserId : false

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.row}>
        <AccountAvatar name={account.name} />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {account.name}
            </Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>{account.currencyCode}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {account.institution ? (
              <View style={styles.institutionBadge}>
                <Ionicons name="business-outline" size={11} color={theme.colors.muted} />
                <Text style={styles.institutionText}>{account.institution}</Text>
              </View>
            ) : null}
            <View style={styles.ownerBadge}>
              <Ionicons name="person-outline" size={11} color={theme.colors.muted} />
              <Text style={styles.ownerText}>{account.owner.displayName}</Text>
            </View>
            {isShared ? (
              <View style={styles.sharedBadge}>
                <Ionicons name="people-outline" size={11} color={theme.colors.accentWarm} />
                <Text style={styles.sharedBadgeText}>Shared</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <View style={styles.participantCount}>
              <Ionicons name="people-outline" size={13} color={theme.colors.accent} />
              <Text style={styles.participantText}>
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.colors.border} style={styles.chevron} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.colors.softForest,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  name: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  currencyBadge: {
    backgroundColor: theme.colors.softForest,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  currencyText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  institutionBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  institutionText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  ownerBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ownerText: {
    color: theme.colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  participantCount: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  participantText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    flexShrink: 0,
  },
  sharedBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sharedBadgeText: {
    color: theme.colors.accentWarm,
    fontSize: 12,
    fontWeight: '600',
  },
})

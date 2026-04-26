import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { theme } from '@/src/constants/theme'

export function SectionCard({
  accent = 'default',
  children,
  subtitle,
  title,
}: {
  accent?: 'default' | 'forest' | 'warm'
  children: ReactNode
  subtitle?: string
  title: string
}) {
  return (
    <View style={[styles.card, accentStyles[accent]]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderColor: theme.colors.border,
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  content: {
    marginTop: 14,
  },
})

const accentStyles = StyleSheet.create({
  default: {
    backgroundColor: theme.colors.surface,
  },
  forest: {
    backgroundColor: theme.colors.softForest,
  },
  warm: {
    backgroundColor: theme.colors.softWarm,
  },
})

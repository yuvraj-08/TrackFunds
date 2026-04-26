import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme } from '@/src/constants/theme'

export function AppScreen({
  children,
  rightAction,
  scrollable = true,
  subtitle,
  title,
}: {
  children: ReactNode
  rightAction?: ReactNode
  scrollable?: boolean
  subtitle?: string
  title: string
}) {
  const content = (
    <View style={styles.body}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
      </View>
      {children}
    </View>
  )

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
      {scrollable ? <ScrollView contentContainerStyle={styles.scroll}>{content}</ScrollView> : content}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.canvas,
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
  },
  body: {
    flex: 1,
    gap: 20,
    padding: 20,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  action: {
    paddingTop: 4,
  },
})

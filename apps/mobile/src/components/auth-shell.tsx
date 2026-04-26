import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { theme } from '@/src/constants/theme'

export function AuthShell({
  children,
  eyebrow,
  subtitle,
  title,
}: {
  children: ReactNode
  eyebrow: string
  subtitle: string
  title: string
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View pointerEvents="none" style={[styles.orb, styles.orbPrimary]} />
          <View pointerEvents="none" style={[styles.orb, styles.orbWarm]} />
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <View style={styles.brandDot} />
              <Text style={styles.brandLabel}>TrackFunds</Text>
            </View>
          </View>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.card}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.canvas,
    flex: 1,
  },
  container: {
    flexGrow: 1,
    gap: 20,
    justifyContent: 'center',
    padding: 20,
  },
  hero: {
    backgroundColor: '#17233f',
    borderRadius: 32,
    gap: 10,
    overflow: 'hidden',
    padding: 24,
    shadowColor: '#0b1222',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  brandRow: {
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  brandBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  brandDot: {
    backgroundColor: '#7ea6ff',
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  brandLabel: {
    color: '#eef4ff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  eyebrow: {
    color: '#b7c8f6',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f7f9ff',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: '#d3dcf4',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: '#ede1d4',
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    shadowColor: '#201a14',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  orb: {
    borderRadius: 999,
    position: 'absolute',
  },
  orbPrimary: {
    backgroundColor: 'rgba(126,166,255,0.2)',
    height: 180,
    right: -30,
    top: -40,
    width: 180,
  },
  orbWarm: {
    backgroundColor: 'rgba(208,107,67,0.16)',
    bottom: -70,
    height: 160,
    right: 30,
    width: 160,
  },
})

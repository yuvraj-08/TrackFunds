import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'

import { theme } from '@/src/constants/theme'

type Tone = 'danger' | 'ghost' | 'primary' | 'warm'

export function PrimaryButton({
  compact = false,
  disabled = false,
  label,
  loading = false,
  onPress,
  tone = 'primary',
}: {
  compact?: boolean
  disabled?: boolean
  label: string
  loading?: boolean
  onPress: () => void
  tone?: Tone
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : null,
        toneStyles[tone],
        disabled || loading ? styles.disabled : null,
        pressed && !disabled && !loading ? styles.pressed : null,
      ]}
    >
      {loading ? <ActivityIndicator color={labelColor[tone]} size="small" /> : null}
      <Text style={[styles.label, labelStyles[tone], loading ? styles.loadingLabel : null]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    gap: 10,
  },
  compact: {
    minHeight: 42,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.55,
  },
  loadingLabel: {
    opacity: 0.95,
  },
})

const toneStyles = StyleSheet.create({
  danger: {
    backgroundColor: '#f5d8d5',
  },
  ghost: {
    backgroundColor: '#ede7d8',
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  warm: {
    backgroundColor: theme.colors.accentWarm,
  },
})

const labelStyles = StyleSheet.create({
  danger: {
    color: theme.colors.danger,
  },
  ghost: {
    color: theme.colors.text,
  },
  primary: {
    color: '#f4fbf5',
  },
  warm: {
    color: '#fff7f1',
  },
})

const labelColor = {
  danger: theme.colors.danger,
  ghost: theme.colors.text,
  primary: '#f4fbf5',
  warm: '#fff7f1',
} as const

import { Pressable, StyleSheet, Text, View } from 'react-native'

import { theme } from '@/src/constants/theme'

export function ChoiceList({
  label,
  onChange,
  options,
  value,
}: {
  label: string
  onChange: (value: string) => void
  options: Array<{ description?: string; label: string; value: string }>
  value: string
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = option.value === value

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, isSelected ? styles.optionSelected : null]}
            >
              <Text style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}>
                {option.label}
              </Text>
              {option.description ? <Text style={styles.optionDescription}>{option.description}</Text> : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  label: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  options: {
    gap: 10,
  },
  option: {
    backgroundColor: '#fffdf8',
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  optionSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  optionLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: theme.colors.accent,
  },
  optionDescription: {
    color: theme.colors.muted,
    fontSize: 13,
  },
})

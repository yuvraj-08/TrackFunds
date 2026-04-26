import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

const PIN_LENGTH = 6

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['bio', '0', 'back'],
]

export function PinPad({
  value,
  onChange,
  onBiometric,
  hasBiometric = false,
  error = false,
}: {
  value: string
  onChange: (value: string) => void
  onBiometric?: () => void
  hasBiometric?: boolean
  error?: boolean
}) {
  const handleKey = (key: string) => {
    if (key === 'back') {
      onChange(value.slice(0, -1))
      return
    }
    if (key === 'bio') {
      onBiometric?.()
      return
    }
    if (value.length < PIN_LENGTH) {
      onChange(value + key)
    }
  }

  return (
    <View style={styles.container}>
      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < value.length ? styles.dotFilled : null,
              error ? styles.dotError : null,
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {ROWS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => {
              const isBio = key === 'bio'
              const isBack = key === 'back'
              const isSpecial = isBio || isBack
              const showBio = isBio && hasBiometric
              const showNothing = isBio && !hasBiometric

              if (showNothing) {
                return <View key={key} style={styles.keyPlaceholder} />
              }

              return (
                <Pressable
                  key={key}
                  onPress={() => handleKey(key)}
                  style={({ pressed }) => [
                    styles.key,
                    isSpecial ? styles.keySpecial : null,
                    pressed ? styles.keyPressed : null,
                  ]}
                  hitSlop={4}
                >
                  {isBack ? (
                    <Ionicons name="backspace-outline" size={22} color="#f5f1e8" />
                  ) : showBio ? (
                    <Ionicons name="finger-print-outline" size={26} color="#f5f1e8" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 36,
  },
  dots: {
    flexDirection: 'row',
    gap: 14,
  },
  dot: {
    borderColor: 'rgba(245,241,232,0.35)',
    borderRadius: 8,
    borderWidth: 2,
    height: 16,
    width: 16,
  },
  dotFilled: {
    backgroundColor: '#f5f1e8',
    borderColor: '#f5f1e8',
  },
  dotError: {
    borderColor: '#ffb3b3',
    backgroundColor: '#ffb3b3',
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  key: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  keySpecial: {
    backgroundColor: 'transparent',
  },
  keyPressed: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  keyPlaceholder: {
    height: 72,
    width: 72,
  },
  keyText: {
    color: '#f5f1e8',
    fontSize: 26,
    fontWeight: '500',
  },
})

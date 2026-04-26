import type { TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { theme } from '@/src/constants/theme'

export function FormField({
  allowPasswordToggle = false,
  label,
  multiline,
  secureTextEntry,
  ...props
}: TextInputProps & { allowPasswordToggle?: boolean; label: string }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const shouldTogglePassword = allowPasswordToggle && secureTextEntry

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputShell, multiline ? styles.multilineShell : null]}>
        <TextInput
          multiline={multiline}
          placeholderTextColor={theme.colors.muted}
          secureTextEntry={shouldTogglePassword ? !isPasswordVisible : secureTextEntry}
          style={[styles.input, multiline ? styles.multiline : null]}
          {...props}
        />
        {shouldTogglePassword ? (
          <Pressable
            hitSlop={8}
            onPress={() => setIsPasswordVisible((currentValue) => !currentValue)}
            style={styles.iconButton}
          >
            <Ionicons
              color={theme.colors.muted}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
            />
          </Pressable>
        ) : null}
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
  inputShell: {
    backgroundColor: '#fffdf8',
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingRight: 12,
  },
  multilineShell: {
    alignItems: 'flex-start',
  },
  input: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  iconButton: {
    alignItems: 'center',
    alignSelf: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
})

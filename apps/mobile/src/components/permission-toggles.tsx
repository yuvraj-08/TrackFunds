import { Pressable, StyleSheet, Text, View } from 'react-native'

import { theme } from '@/src/constants/theme'

type PermissionDraft = {
  canAddTransactions: boolean
  canDeleteTransactions: boolean
  canEditTransactions: boolean
  canManageParticipants: boolean
  canView: boolean
}

const permissionLabels: Array<{ key: keyof PermissionDraft; label: string }> = [
  { key: 'canView', label: 'Can view' },
  { key: 'canAddTransactions', label: 'Can add transactions' },
  { key: 'canEditTransactions', label: 'Can edit transactions' },
  { key: 'canDeleteTransactions', label: 'Can delete transactions' },
  { key: 'canManageParticipants', label: 'Can manage participants' },
]

export function PermissionToggles({
  onChange,
  value,
}: {
  onChange: (value: PermissionDraft) => void
  value: PermissionDraft
}) {
  return (
    <View style={styles.wrapper}>
      {permissionLabels.map((item) => {
        const active = value[item.key]

        return (
          <Pressable
            key={item.key}
            onPress={() =>
              onChange({
                ...value,
                [item.key]: !active,
              })
            }
            style={[styles.toggle, active ? styles.toggleActive : null]}
          >
            <Text style={[styles.toggleLabel, active ? styles.toggleLabelActive : null]}>
              {item.label}
            </Text>
            <Text style={styles.toggleValue}>{active ? 'Yes' : 'No'}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  toggle: {
    alignItems: 'center',
    backgroundColor: '#fffdf8',
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  toggleActive: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  toggleLabel: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleLabelActive: {
    color: theme.colors.accent,
  },
  toggleValue: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
})

import type { Theme } from '@react-navigation/native'

export const theme = {
  colors: {
    canvas: '#f5efe7',
    surface: '#fff9f4',
    softWarm: '#f4dccb',
    softForest: '#e7e8f7',
    border: '#e1d2c5',
    text: '#1f2337',
    muted: '#6f6676',
    accent: '#2f4d8f',
    accentWarm: '#d06b43',
    danger: '#b63b34',
    success: '#2c7a62',
  },
} as const

export const appNavigationTheme: Theme = {
  dark: false,
  colors: {
    background: theme.colors.canvas,
    border: theme.colors.border,
    card: theme.colors.surface,
    notification: theme.colors.accentWarm,
    primary: theme.colors.accent,
    text: theme.colors.text,
  },
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '800',
    },
  },
}

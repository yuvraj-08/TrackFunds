import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'

import { theme } from '@/src/constants/theme'

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: {
          backgroundColor: theme.colors.canvas,
        },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            color={color}
            name={iconNameByRoute[route.name as keyof typeof iconNameByRoute]}
            size={size}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="accounts" options={{ title: 'Accounts' }} />
      <Tabs.Screen name="more" options={{ title: 'Balance' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}

const iconNameByRoute = {
  accounts: 'wallet-outline',
  home: 'home-outline',
  index: 'ellipse-outline',
  more: 'cash-outline',
  profile: 'person-outline',
} as const

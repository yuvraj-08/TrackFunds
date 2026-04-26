import { createContext, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import {
  API_BASE_URL,
  type AuthSession,
  createRequestExecutor,
  type RequestPasswordResetResponse,
  type ResetPasswordResponse,
} from '@/src/lib/api'
import { clearStoredSession, readStoredSession, writeStoredSession } from '@/src/lib/storage'

type SessionContextValue = {
  api: ReturnType<typeof createRequestExecutor>
  isReady: boolean
  requestPasswordReset: (email: string) => Promise<RequestPasswordResetResponse>
  resetPassword: (body: { newPassword: string; token: string }) => Promise<ResetPasswordResponse>
  session: AuthSession | null
  signIn: (body: { email: string; password: string }) => Promise<void>
  signOut: () => Promise<void>
  signOutEverywhere: () => Promise<void>
  signUp: (body: { displayName: string; email: string; password: string }) => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isReady, setIsReady] = useState(false)
  const sessionRef = useRef<AuthSession | null>(null)
  const refreshPromiseRef = useRef<Promise<void> | null>(null)

  const persistSession = async (nextSession: AuthSession | null) => {
    sessionRef.current = nextSession
    setSession(nextSession)

    if (nextSession) {
      await writeStoredSession(JSON.stringify(nextSession))
      return
    }

    await clearStoredSession()
  }

  useEffect(() => {
    void readStoredSession()
      .then((storedSession) => {
        if (storedSession) {
          const parsedSession = JSON.parse(storedSession) as AuthSession
          sessionRef.current = parsedSession
          setSession(parsedSession)
        }
      })
      .finally(() => {
        setIsReady(true)
      })
  }, [])

  const refreshSession = async () => {
    if (!sessionRef.current?.refreshToken) {
      await persistSession(null)
      throw new Error('Session expired.')
    }

    if (refreshPromiseRef.current) {
      await refreshPromiseRef.current
      return
    }

    refreshPromiseRef.current = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      body: JSON.stringify({ refreshToken: sessionRef.current.refreshToken }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as AuthSession | null

        if (!response.ok || !payload) {
          await persistSession(null)
          throw new Error('Session expired.')
        }

        await persistSession(payload)
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    await refreshPromiseRef.current
  }

  const api = createRequestExecutor(
    () => sessionRef.current?.accessToken ?? null,
    refreshSession,
  )

  const signIn = async (body: { email: string; password: string }) => {
    const nextSession = await api.signIn(body)
    await persistSession(nextSession)
  }

  const signUp = async (body: { displayName: string; email: string; password: string }) => {
    const nextSession = await api.signUp(body)
    await persistSession(nextSession)
  }

  const requestPasswordReset = async (email: string) => api.requestPasswordReset(email)

  const resetPassword = async (body: { newPassword: string; token: string }) =>
    api.resetPassword(body)

  const signOut = async () => {
    if (sessionRef.current?.refreshToken) {
      await api.request('/api/v1/auth/logout', {
        body: { refreshToken: sessionRef.current.refreshToken },
        method: 'POST',
      })
    }

    await persistSession(null)
  }

  const signOutEverywhere = async () => {
    if (sessionRef.current?.accessToken) {
      await api.request('/api/v1/auth/logout-all', {
        method: 'POST',
      })
    }

    await persistSession(null)
  }

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#184f36" />
      </View>
    )
  }

  return (
    <SessionContext.Provider
      value={{
        api,
        isReady,
        requestPasswordReset,
        resetPassword,
        session,
        signIn,
        signOut,
        signOutEverywhere,
        signUp,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

const styles = StyleSheet.create({
  splash: {
    alignItems: 'center',
    backgroundColor: '#f3efe6',
    flex: 1,
    justifyContent: 'center',
  },
})

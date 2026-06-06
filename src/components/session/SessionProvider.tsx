'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type SessionUser = {
  _id: string
  userId: string
  role: 'super_admin' | 'admin' | 'user'
  username: string
  fullName: string
}

type SessionState = {
  user: SessionUser | null
  loading: boolean
  refresh: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: SessionUser | null) => void
}

const SessionCtx = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Track whether user was already set directly (e.g., from login response)
  // to skip the redundant /api/auth/me fetch
  const userSetDirectly = useRef(false)

  // Wrapped setUser that also marks the direct-set flag
  const setUserDirect = useCallback((u: SessionUser | null) => {
    if (u) {
      userSetDirectly.current = true
    }
    setUser(u)
    setLoading(false)
  }, [])

  const refresh = useCallback(async () => {
    // Skip fetch if user was already set directly (e.g., from login response)
    if (userSetDirectly.current) {
      userSetDirectly.current = false
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
        credentials: 'include',
      })
      const json = await res.json().catch(() => ({}))
      const sessionUser = json?.user ?? null
      setUser(sessionUser)

      // Redirect ke login jika tidak ada session dan bukan di halaman login
      if (!sessionUser && pathname !== '/' && pathname !== '/signup') {
        router.replace('/')
      }
    } catch (err) {
      // Network error — treat as no session
      console.error('Session refresh error:', err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  async function logout() {
    // Clear user state FIRST to prevent redirect loops
    setUser(null)
    userSetDirectly.current = false
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Logout error:', err)
    }
    router.replace('/')
  }

  // Auto-refresh session saat mount
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <SessionCtx.Provider value={{ user, loading, refresh, logout, setUser: setUserDirect }}>
      {children}
    </SessionCtx.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
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
}

const SessionCtx = createContext<SessionState | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  async function refresh() {
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
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    // Clear user state FIRST to prevent redirect loops
    setUser(null)
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
    <SessionCtx.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </SessionCtx.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}

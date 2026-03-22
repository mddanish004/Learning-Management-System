import { useState, useEffect, useCallback } from 'react'
import { getToken, setToken, clearToken, decodeToken } from '../lib/api'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(() => {
    const token = getToken()
    if (token) {
      const payload = decodeToken(token)
      if (payload && payload.sub) {
        const exp = payload.exp ? payload.exp * 1000 : Infinity
        if (Date.now() < exp) {
          setUser({ id: payload.sub, role: payload.role || 'learner' })
        } else {
          clearToken()
          setUser(null)
        }
      } else {
        clearToken()
        setUser(null)
      }
    } else {
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      loadUser()
    })
  }, [loadUser])

  const login = useCallback((accessToken) => {
    setToken(accessToken)
    const payload = decodeToken(accessToken)
    if (payload && payload.sub) {
      setUser({ id: payload.sub, role: payload.role || 'learner' })
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // ignore
    }
    clearToken()
    setUser(null)
  }, [])

  const value = { user, loading, login, logout, loadUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


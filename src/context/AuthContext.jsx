import { createContext, useContext, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import { db } from '../services/db'
import { initData } from '../services/init'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsub = () => {}
    let cancelled = false

    ;(async () => {
      try {
        await initData()
        if (authService.isFirebaseReady()) {
          const auth = authService.getAuthInstance()
          const { onAuthStateChanged } = await import('firebase/auth')
          unsub = onAuthStateChanged(auth, async (fbUser) => {
            if (cancelled) return
            if (!fbUser) {
              setUser(null)
              setLoading(false)
              return
            }
            const profile = await authService.getProfile(fbUser.uid)
            setUser(
              profile || {
                id: fbUser.uid,
                uid: fbUser.uid,
                name: fbUser.displayName || 'Pengguna',
                email: fbUser.email,
                userType: 'Rumah',
                role: 'user',
                points: 0,
                energyTarget: 300,
                createdAt: new Date().toISOString(),
              },
            )
            setLoading(false)
          })
        } else {
          const session = authService.getSessionUser()
          setUser(session)
          setLoading(false)
          if (session && authService.isApiMode()) {
            authService
              .getProfile(session.id)
              .then((fresh) => {
                if (cancelled) return
                if (fresh) {
                  setUser(fresh)
                } else {
                  authService.clearSession()
                  setUser(null)
                }
              })
              .catch(() => {
                // API tidak tersedia (mis. XAMPP mati) — sinkronkan dari data lokal
                db.getById('users', session.id)
                  .then((local) => {
                    if (cancelled || !local) return
                    setUser(local)
                    authService.updateSessionUser(local)
                  })
                  .catch(() => {})
              })
          }
        }
      } catch {
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  const login = async (email, password) => {
    const u = await authService.login(email, password)
    setUser(u)
    return u
  }
  const register = async (data) => {
    const u = await authService.register(data)
    setUser(u)
    return u
  }
  const loginDemo = async () => {
    const u = await authService.loginDemo()
    setUser(u)
    return u
  }
  const logout = async () => {
    await authService.logout()
    setUser(null)
  }
  const resetPassword = (email) => authService.resetPassword(email)
  const changePassword = (data) => authService.changePassword(data)
  const updateUser = async (patch) => {
    const u = await authService.updateUser(patch)
    setUser(u)
    return u
  }
  const awardPoints = async (amount) => {
    const u = await authService.updateUser({ pointsDelta: amount })
    setUser(u)
    return u
  }
  const reloadUser = async () => {
    if (!user) return
    const fresh = await authService.getProfile(user.id)
    if (fresh) setUser(fresh)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginDemo,
        logout,
        resetPassword,
        changePassword,
        updateUser,
        awardPoints,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

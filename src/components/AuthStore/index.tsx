import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { api, type User } from '../../api'

interface AuthContextType {
  user: User | null
  token: string
  isLoggedIn: boolean
  isStudent: boolean
  login: (user: User, token: string) => void
  logout: () => void
  checkLogin: () => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = Taro.getStorageSync('token') || ''
    const u = Taro.getStorageSync('user')
    if (t && u) {
      setToken(t)
      setUser(JSON.parse(u))
    }
    setReady(true)
  }, [])

  const login = (u: User, t: string) => {
    setUser(u)
    setToken(t)
    Taro.setStorageSync('token', t)
    Taro.setStorageSync('user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    setToken('')
    Taro.removeStorageSync('token')
    Taro.removeStorageSync('user')
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  const checkLogin = () => {
    if (!token) {
      Taro.showModal({ title: '提示', content: '请先登录', success: (r) => { if (r.confirm) Taro.navigateTo({ url: '/pages/auth/login/index' }) } })
      return false
    }
    return true
  }

  const refreshProfile = async () => {
    try {
      const u = await api.getMe()
      setUser(u)
      Taro.setStorageSync('user', JSON.stringify(u))
    } catch { /* ignore */ }
  }

  if (!ready) return null

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, isStudent: user?.role === 'STUDENT', login, logout, checkLogin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

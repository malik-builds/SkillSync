'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { User, SignUpRequest, SignInRequest } from '@/types/user'
import {
  signUp as apiSignUp,
  signIn as apiSignIn,
  logoutApi,
  getCurrentUser,
  updateUserProfile,
  forgotPassword as apiForgotPassword,
  resetPassword as apiResetPassword,
  completeOnboarding as apiCompleteOnboarding,
} from '@/lib/api/auth-api'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean

  // Auth actions
  signUp: (data: SignUpRequest) => Promise<{ userId: string; email: string }>
  signIn: (data: SignInRequest) => Promise<{ user: User; redirect: string }>
  logout: () => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, newPassword: string) => Promise<void>

  // User update
  updateUser: (updates: Partial<User>) => Promise<void>
  completeOnboarding: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadSession()
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    }
  }, [])

  const signUp = useCallback(async (data: SignUpRequest) => {
    setIsLoading(true)
    try {
      const response = await apiSignUp(data)
      setUser(response.user)
      return { userId: response.user.id, email: response.user.email }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signIn = useCallback(async (data: SignInRequest) => {
    setIsLoading(true)
    try {
      const response = await apiSignIn(data)
      setUser(response.user)
      return { user: response.user, redirect: response.redirect }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    logoutApi()
    setUser(null)
  }, [])

  const forgotPassword = useCallback(async (email: string) => {
    await apiForgotPassword({ email })
  }, [])

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    await apiResetPassword({ token, newPassword })
  }, [])

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const updatedUser = await updateUserProfile(updates)
    setUser(updatedUser)
  }, [])

  const completeOnboarding = useCallback(async () => {
    await apiCompleteOnboarding()
    await refreshUser()
  }, [refreshUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
        completeOnboarding,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

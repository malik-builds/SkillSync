// ============================================================
// Auth Helpers — Utility functions for auth state checks
// ============================================================

import { User, UserRole } from '@/types/user'
import { getToken } from '@/lib/api/client'

/** Check if user has an active session token */
export function isAuthenticated(): boolean {
  return !!getToken()
}

/** Get role from a user object */
export function getUserRole(user: User | null): UserRole | null {
  return user?.role ?? null
}

/** Check if a student user still needs to complete onboarding */
export function needsOnboarding(user: User | null): boolean {
  if (!user) return false
  if (user.role !== 'student') return false
  return !user.onboarding?.completed
}

/** Get the correct redirect path based on user state */
export function getAuthRedirect(user: User): string {
  if (user.role === 'student') {
    return user.onboarding?.completed
      ? '/student/dashboard'
      : '/onboarding'
  }
  if (user.role === 'recruiter') return '/recruiter/dashboard'
  if (user.role === 'university') return '/university/dashboard'
  return '/'
}

/** Password strength checker: returns 0-4 score */
export function checkPasswordStrength(password: string): {
  score: number
  level: 'weak' | 'fair' | 'good' | 'strong'
  color: string
} {
  if (!password) return { score: 0, level: 'weak', color: 'gray' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { score, level: 'weak', color: 'red' }
  if (score === 2) return { score, level: 'fair', color: 'orange' }
  if (score === 3) return { score, level: 'good', color: 'yellow' }
  return { score, level: 'strong', color: 'green' }
}

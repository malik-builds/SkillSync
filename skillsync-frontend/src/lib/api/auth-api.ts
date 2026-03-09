// ============================================================
// Auth API — Authentication & Onboarding endpoints
// ============================================================

import { api, setToken, clearToken, getToken } from './client'
import {
  User,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  CVUploadResponse,
  GitHubConnectResponse,
  AnalysisResponse,
} from '@/types/user'

// ============================================================
// AUTH
// ============================================================

/** POST /auth/signup */
export async function signUp(data: SignUpRequest): Promise<SignUpResponse> {
  // Map fullName (frontend) to name (backend SignUpRequest schema)
  const backendData = {
    ...data,
    name: data.fullName
  }
  const response = await api.post<SignUpResponse>('/auth/signup', backendData)
  setToken(response.token)
  return response
}

/** POST /auth/signin */
export async function signIn(data: SignInRequest): Promise<SignInResponse> {
  const response = await api.post<SignInResponse>('/auth/signin', data)
  setToken(response.token, data.rememberMe)
  return response
}

/** POST /auth/forgot-password */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return api.post<ForgotPasswordResponse>('/auth/forgot-password', data)
}

/** POST /auth/reset-password */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return api.post<ResetPasswordResponse>('/auth/reset-password', data)
}

/** POST /auth/logout */
export async function logoutApi(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // Always clear local tokens even if the API call fails
  } finally {
    clearToken()
  }
}

/** GET /auth/me — Get current user from token */
export async function getCurrentUser(): Promise<User | null> {
  const token = getToken()
  if (!token) return null
  try {
    return await api.get<User>('/auth/me')
  } catch {
    clearToken()
    return null
  }
}

// ============================================================
// ONBOARDING
// ============================================================

/** POST /cv/upload (multipart/form-data) */
export async function uploadCV(file: File, userId: string, githubUrl?: string, targetJob?: string): Promise<CVUploadResponse> {
  const formData = new FormData()
  formData.append('cv', file)
  formData.append('userId', userId)

  let url = '/cv/upload'
  const params = new URLSearchParams()
  if (githubUrl) params.append('github_url', githubUrl)
  if (targetJob) params.append('target_job_title', targetJob)

  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  return api.upload<CVUploadResponse>(url, formData)
}

/** POST /analyze (multipart/form-data) */
export async function analyzeProfile(file: File, githubUrl?: string, targetJob?: string): Promise<AnalysisResponse> {
  const formData = new FormData()
  formData.append('file', file)

  let url = '/analyze'
  const params = new URLSearchParams()
  if (githubUrl) params.append('github_url', githubUrl)
  if (targetJob) params.append('target_job_title', targetJob)

  const queryString = params.toString()
  if (queryString) {
    url += `?${queryString}`
  }

  return api.upload<AnalysisResponse>(url, formData)
}

/** POST /auth/github/connect */
export async function connectGitHub(): Promise<GitHubConnectResponse> {
  return api.post<GitHubConnectResponse>('/auth/github/connect')
}


/** POST /user/target-role */
export async function setTargetRole(role: string): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>('/user/target-role', { role })
}

/** POST /user/complete-onboarding */
export async function completeOnboarding(): Promise<{ success: boolean }> {
  return api.post<{ success: boolean }>('/user/complete-onboarding')
}

/** PATCH /user/profile */
export async function updateUserProfile(updates: Partial<User>): Promise<User> {
  return api.patch<User>('/user/profile', updates)
}

// ============================================================
// API Client — Centralized HTTP client for all backend calls
// ============================================================

import { ApiError } from '@/types/user'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// ============================================================
// Token Management
// ============================================================

const TOKEN_KEY = 'skillsync_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null
}

export function setToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

// ============================================================
// Generic API Request
// ============================================================

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  // Set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  const rawBody = await response.text()
  let data: any = {}
  if (rawBody) {
    try {
      data = JSON.parse(rawBody)
    } catch {
      data = { message: rawBody }
    }
  }

  if (!response.ok) {
    const error: ApiError = {
      success: false,
      error: data.error || data.detail || data.message || 'An unexpected error occurred',
      code: response.status,
      details: data.details || undefined,
    }
    throw error
  }

  return data as T
}

// ============================================================
// Convenience Methods
// ============================================================

export const api = {
  get: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),

  /** Upload files via FormData */
  upload: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: formData,
    }),
}

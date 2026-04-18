import type { ApiResponse, AuthResponse, UserProfile } from '../../../types/api'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem('access_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const json: ApiResponse<T> = await res.json()
  if (!res.ok || json.code >= 40000) {
    throw new AuthError(json.message, json.code)
  }
  return json.data
}

export class AuthError extends Error {
  code: number
  constructor(message: string, code: number) {
    super(message)
    this.code = code
  }
}

export const authService = {
  async login(email: string, password: string) {
    const data = await request<AuthResponse>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    return data
  },

  async register(input: { email: string; password: string; nickname: string; referral_code?: string }) {
    const data = await request<AuthResponse>('/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    return data
  },

  async forgotPassword(email: string) {
    return request<null>('/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  async resetPassword(code: string, new_password: string) {
    return request<null>('/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ code, new_password }),
    })
  },

  async refreshToken() {
    const refresh_token = sessionStorage.getItem('refresh_token')
    if (!refresh_token) throw new AuthError('No refresh token', 40101)
    const data = await request<AuthResponse>('/v1/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    })
    sessionStorage.setItem('access_token', data.access_token)
    sessionStorage.setItem('refresh_token', data.refresh_token)
    return data
  },

  async getMe() {
    return request<UserProfile>('/v1/auth/me')
  },

  async logout() {
    try {
      await request<null>('/v1/auth/logout', { method: 'POST' })
    } finally {
      sessionStorage.removeItem('access_token')
      sessionStorage.removeItem('refresh_token')
    }
  },

  isAuthenticated() {
    return !!sessionStorage.getItem('access_token')
  },
}

import { useState, useCallback } from 'react'
import { authService, AuthError } from '../services/auth-service'
import { LoginSchema } from '../schemas'
import type { AuthResponse } from '../../../types/api'

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse | null> => {
    setError(null)
    const result = LoginSchema.safeParse({ email, password })
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '验证失败')
      return null
    }

    setIsLoading(true)
    try {
      const data = await authService.login(email, password)
      return data
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('登录失败，请稍后重试')
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { login, isLoading, error, clearError: () => setError(null) }
}

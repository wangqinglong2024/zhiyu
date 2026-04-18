import { useState, useCallback } from 'react'
import { authService, AuthError } from '../services/auth-service'
import { RegisterSchema } from '../schemas'
import type { AuthResponse } from '../../../types/api'

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = useCallback(async (input: {
    email: string
    password: string
    nickname: string
    referral_code?: string
    agree_terms: boolean
  }): Promise<AuthResponse | null> => {
    setError(null)
    const result = RegisterSchema.safeParse(input)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '验证失败')
      return null
    }

    setIsLoading(true)
    try {
      const data = await authService.register({
        email: input.email,
        password: input.password,
        nickname: input.nickname,
        referral_code: input.referral_code || undefined,
      })
      return data
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('注册失败，请稍后重试')
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { register, isLoading, error, clearError: () => setError(null) }
}

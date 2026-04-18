import { useState, useCallback } from 'react'
import { authService, AuthError } from '../services/auth-service'

type ForgotStep = 'email' | 'code' | 'done'

export function useForgotPassword() {
  const [step, setStep] = useState<ForgotStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')

  const sendCode = useCallback(async (emailInput: string) => {
    setError(null)
    setIsLoading(true)
    try {
      await authService.forgotPassword(emailInput)
      setEmail(emailInput)
      setStep('code')
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('发送失败，请稍后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetPassword = useCallback(async (code: string, newPassword: string) => {
    setError(null)
    setIsLoading(true)
    try {
      await authService.resetPassword(code, newPassword)
      setStep('done')
    } catch (err) {
      if (err instanceof AuthError) {
        setError(err.message)
      } else {
        setError('重置失败，请稍后重试')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setStep('email')
    setError(null)
    setEmail('')
  }, [])

  return { step, email, sendCode, resetPassword, reset, isLoading, error, clearError: () => setError(null) }
}

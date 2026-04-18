import { type FC, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { PasswordInput } from './PasswordInput'
import { OAuthButtons } from './OAuthButtons'
import { useLogin } from '../hooks/use-login'
import type { AuthResponse } from '../../../types/api'

interface LoginFormProps {
  onSuccess: (data: AuthResponse) => void
  onSwitchToRegister: () => void
  onForgotPassword: () => void
}

export const LoginForm: FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onForgotPassword,
}) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const { login, isLoading, error } = useLogin()

  const isValid = email.includes('@') && password.length >= 8

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await login(email, password)
    if (result) onSuccess(result)
  }

  const handleEmailBlur = () => {
    if (email && !email.includes('@')) {
      setEmailError('请输入有效的邮箱地址')
    } else {
      setEmailError('')
    }
  }

  return (
    <div className="px-6 py-2">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">欢迎回来</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">登录你的知语账号</p>
      </div>

      <OAuthButtons
        onGoogle={() => {/* OAuth 占位 */}}
        onApple={() => {/* OAuth 占位 */}}
        loading={isLoading}
      />

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-tertiary)]">或</span>
        <div className="flex-1 h-px bg-[var(--color-border)]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="email"
            className={`glass-input ${emailError ? 'border-red-500' : ''}`}
            placeholder="邮箱地址"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            disabled={isLoading}
            autoComplete="email"
          />
          {emailError && <p className="text-red-500 text-xs mt-1 px-1">{emailError}</p>}
        </div>

        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="密码"
          disabled={isLoading}
        />

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-[var(--color-accent-rose)] hover:underline"
            onClick={onForgotPassword}
          >
            忘记密码？
          </button>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center py-1">{error}</p>
        )}

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={!isValid || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>登录中…</span>
            </>
          ) : '登录'}
        </button>
      </form>

      <p className="text-center text-sm mt-5 text-[var(--color-text-secondary)]">
        还没有账号？
        <button
          type="button"
          className="text-[var(--color-accent-rose)] font-medium ml-1 hover:underline"
          onClick={onSwitchToRegister}
        >
          立即注册
        </button>
      </p>
    </div>
  )
}

LoginForm.displayName = 'LoginForm'

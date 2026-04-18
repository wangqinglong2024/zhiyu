import { type FC, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { PasswordInput } from './PasswordInput'
import { PasswordStrength } from './PasswordStrength'
import { useRegister } from '../hooks/use-register'
import type { AuthResponse } from '../../../types/api'

interface RegisterFormProps {
  onSuccess: (data: AuthResponse) => void
  onSwitchToLogin: () => void
}

export const RegisterForm: FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const { register, isLoading, error } = useRegister()

  const isValid = email.includes('@') && password.length >= 8 && nickname.length >= 2 && agreeTerms

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await register({
      email,
      password,
      nickname,
      referral_code: referralCode || undefined,
      agree_terms: agreeTerms,
    })
    if (result) onSuccess(result)
  }

  return (
    <div className="px-6 py-2">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">创建账号</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">开启你的中文学习之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          className="glass-input"
          placeholder="邮箱地址"
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isLoading}
          autoComplete="email"
        />

        <div>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="密码（至少 8 位，含字母和数字）"
            disabled={isLoading}
          />
          <PasswordStrength password={password} />
        </div>

        <input
          type="text"
          className="glass-input"
          placeholder="昵称"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          disabled={isLoading}
          maxLength={20}
        />

        <input
          type="text"
          className="glass-input"
          placeholder="推荐码（选填）"
          value={referralCode}
          onChange={e => setReferralCode(e.target.value)}
          disabled={isLoading}
          maxLength={8}
        />

        <label className="flex items-start gap-2 px-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={e => setAgreeTerms(e.target.checked)}
            className="mt-0.5 accent-[var(--color-accent-rose)]"
          />
          <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            我已阅读并同意
            <a href="/privacy" className="text-[var(--color-accent-rose)] mx-0.5">隐私政策</a>
            和
            <a href="/terms" className="text-[var(--color-accent-rose)] mx-0.5">服务条款</a>
          </span>
        </label>

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
              <span>注册中…</span>
            </>
          ) : '注册'}
        </button>
      </form>

      <p className="text-center text-sm mt-5 text-[var(--color-text-secondary)]">
        已有账号？
        <button
          type="button"
          className="text-[var(--color-accent-rose)] font-medium ml-1 hover:underline"
          onClick={onSwitchToLogin}
        >
          立即登录
        </button>
      </p>
    </div>
  )
}

RegisterForm.displayName = 'RegisterForm'

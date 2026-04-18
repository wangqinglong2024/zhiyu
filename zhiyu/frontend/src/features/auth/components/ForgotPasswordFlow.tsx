import { type FC, useState, type FormEvent } from 'react'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { PasswordInput } from './PasswordInput'
import { PasswordStrength } from './PasswordStrength'
import { useForgotPassword } from '../hooks/use-forgot-password'

interface ForgotPasswordFlowProps {
  onBack: () => void
  onDone: () => void
}

export const ForgotPasswordFlow: FC<ForgotPasswordFlowProps> = ({ onBack, onDone }) => {
  const { step, sendCode, resetPassword, isLoading, error } = useForgotPassword()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault()
    await sendCode(email)
  }

  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    await resetPassword(code, newPassword)
  }

  if (step === 'done') {
    return (
      <div className="px-6 py-8 text-center">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-bold mb-2">密码已重置</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">请使用新密码重新登录</p>
        <button className="btn-primary w-full" onClick={onDone}>
          返回登录
        </button>
      </div>
    )
  }

  return (
    <div className="px-6 py-2">
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] mb-4 hover:text-[var(--color-text-primary)]"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        返回登录
      </button>

      <h2 className="text-xl font-bold mb-1">重置密码</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-5">
        {step === 'email' ? '输入注册邮箱，我们将发送验证码' : '输入验证码和新密码'}
      </p>

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-3">
          <input
            type="email"
            className="glass-input"
            placeholder="邮箱地址"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isLoading}
            autoComplete="email"
          />
          {error && <p className="text-red-500 text-sm px-1">{error}</p>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!email.includes('@') || isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : '发送验证码'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleReset} className="space-y-3">
          <input
            type="text"
            className="glass-input text-center tracking-widest"
            placeholder="验证码"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={isLoading}
            maxLength={6}
            inputMode="numeric"
          />
          <div>
            <PasswordInput
              value={newPassword}
              onChange={setNewPassword}
              placeholder="新密码"
              disabled={isLoading}
            />
            <PasswordStrength password={newPassword} />
          </div>
          {error && <p className="text-red-500 text-sm px-1">{error}</p>}
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={code.length !== 6 || newPassword.length < 8 || isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : '确认重置'}
          </button>
        </form>
      )}
    </div>
  )
}

ForgotPasswordFlow.displayName = 'ForgotPasswordFlow'

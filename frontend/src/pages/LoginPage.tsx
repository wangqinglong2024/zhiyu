/**
 * 登录页：手机号 + 短信验证码
 * Mesh Gradient Glassmorphism 风格，支持 Light/Dark 双模式
 * 背景层由 App.tsx 全局注入（z:0 网格 + z:1 粒子），本页内容在 z:2
 */
import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../components/common/ThemeToggle'
import { sendSms, login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function LoginPage() {
  const [phone, setPhone]         = useState('')
  const [code, setCode]           = useState('')
  const [sending, setSending]     = useState(false)
  const [logging, setLogging]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError]         = useState('')
  const navigate                  = useNavigate()
  const [searchParams]            = useSearchParams()
  const setToken                  = useAuthStore((s) => s.setToken)
  const inviteCode                = searchParams.get('invite') || undefined

  const handleSendSms = useCallback(async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setSending(true)
    setError('')
    try {
      await sendSms(phone)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } catch (e: any) {
      setError(e.response?.data?.message || '发送失败，请稍后重试')
    } finally {
      setSending(false)
    }
  }, [phone])

  const handleLogin = useCallback(async () => {
    if (!phone || !code) { setError('请填写手机号和验证码'); return }
    setLogging(true)
    setError('')
    try {
      const res = await login(phone, code, inviteCode)
      const token = res.data.data?.access_token
      if (token) {
        setToken(token)
        navigate('/', { replace: true })
      }
    } catch (e: any) {
      setError(e.response?.data?.message || '登录失败，请重试')
    } finally {
      setLogging(false)
    }
  }, [phone, code, inviteCode, setToken, navigate])

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-5"
      style={{ zIndex: 2 }}
    >
      {/* 右上角主题切换 */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* 装饰性浮动玻璃块 */}
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 64,
          height: 64,
          top: '12%',
          left: '8%',
          background: 'rgba(14,165,233,0.08)',
          border: '1px solid rgba(14,165,233,0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          animationDelay: '0s',
        }}
      />
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          bottom: '18%',
          right: '10%',
          background: 'rgba(225,29,72,0.08)',
          border: '1px solid rgba(225,29,72,0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.75rem',
          animationDelay: '2s',
        }}
      />
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 48,
          height: 48,
          top: '60%',
          left: '5%',
          background: 'rgba(251,191,36,0.07)',
          border: '1px solid rgba(251,191,36,0.14)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1.25rem',
          animationDelay: '3.5s',
        }}
      />
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          top: '22%',
          right: '15%',
          background: 'rgba(14,165,233,0.06)',
          border: '1px solid rgba(14,165,233,0.12)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.625rem',
          animationDelay: '5s',
        }}
      />

      <motion.div
        className="w-full max-w-sm"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        {/* Logo 区 */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-3xl font-bold mb-2 tracking-widest"
            style={{ color: 'var(--accent-text)' }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            内观
          </motion.h1>
          <motion.p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            AI 认知镜 · 看清困境的本质
          </motion.p>
        </div>

        {/* 玻璃表单卡片 */}
        <div className="glass-card p-8">
          <div className="flex flex-col gap-7">

            {/* 手机号输入 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                手机号
              </label>
              <input
                className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none"
                style={{
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                }}
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            {/* 验证码 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium tracking-wide" style={{ color: 'var(--text-secondary)' }}>
                验证码
              </label>
              <div className="flex items-center gap-3">
                <input
                  className="glass-input flex-1 px-4 py-3 rounded-xl text-base outline-none"
                  style={{
                    color: 'var(--text-primary)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--glass-border)',
                  }}
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <motion.button
                  className="text-sm whitespace-nowrap px-4 py-3 rounded-xl transition-all duration-300 ease-out"
                  style={{
                    color: countdown > 0 || sending ? 'var(--text-muted)' : 'var(--accent-text)',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--glass-border)',
                    cursor: countdown > 0 || sending ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                  disabled={countdown > 0 || sending}
                  onClick={handleSendSms}
                  whileTap={countdown > 0 || sending ? {} : { scale: 0.94 }}
                >
                  {sending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
                </motion.button>
              </div>
            </div>

            {error && (
              <motion.p
                className="text-sm -mt-3"
                style={{ color: 'var(--color-error, #f43f5e)' }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            {/* 登录按钮 */}
            <motion.button
              className="btn-primary w-full py-3.5 text-base font-semibold text-white"
              onClick={handleLogin}
              disabled={logging}
              whileTap={{ scale: 0.97 }}
              style={{ opacity: logging ? 0.75 : 1 }}
            >
              {logging ? '登录中...' : '登录 / 注册'}
            </motion.button>
          </div>
        </div>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </motion.div>
    </div>
  )
}

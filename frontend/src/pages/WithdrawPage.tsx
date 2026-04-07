/**
 * 提现申请页面
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Button from '../components/common/Button'
import ThemeToggle from '../components/common/ThemeToggle'
import { getBalance } from '../api/commissions'
import { applyWithdrawal } from '../api/withdrawals'
import { useAuth } from '../hooks/useAuth'

export default function WithdrawPage() {
  useAuth()
  const navigate = useNavigate()

  const [amount, setAmount]             = useState('')
  const [payeeMethod, setPayeeMethod]   = useState<'wechat' | 'alipay'>('alipay')
  const [payeeName, setPayeeName]       = useState('')
  const [payeeAccount, setPayeeAccount] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [submitted, setSubmitted]       = useState(false)
  const [error, setError]               = useState('')

  const { data: balanceData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getBalance().then((r) => r.data.data),
  })
  const balance = balanceData?.wallet?.balance ?? 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 50) { setError('提现金额最低 50 元'); return }
    if (amountNum > balance)                { setError('提现金额不能超过可提现余额'); return }
    if (!payeeName.trim())                  { setError('请填写真实姓名'); return }
    if (!payeeAccount.trim())               { setError('请填写收款账号'); return }
    setSubmitting(true)
    try {
      await applyWithdrawal({ amount: amountNum, payee_name: payeeName.trim(), payee_account: payeeAccount.trim(), payee_method: payeeMethod })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div
        className="relative min-h-screen px-5 pt-12 pb-24 flex flex-col items-center justify-center"
        style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card p-10 w-full text-center"
          style={{ borderColor: 'rgba(14,165,233,0.25)' }}
        >
          <motion.div
            className="text-5xl mb-5"
            style={{ color: '#22c55e' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          >
            ✓
          </motion.div>
          <p className="text-lg font-semibold mb-2" style={{ color: '#22c55e' }}>申请已提交</p>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            提现申请已提交，预计 1–3 个工作日到账
          </p>
          <Button onClick={() => navigate('/profile')}>返回我的页面</Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen px-5 pt-12 pb-24"
      style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
    >
      <div className="fixed top-5 right-5 z-50"><ThemeToggle /></div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
        {/* 顶部 */}
        <div className="flex items-center mb-8">
          <motion.button
            className="text-sm transition-all duration-300 ease-out"
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
            whileTap={{ scale: 0.94 }}
          >
            ← 返回
          </motion.button>
          <h1 className="flex-1 text-center text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            申请提现
          </h1>
          <div style={{ width: 48 }} />
        </div>

        {/* 余额展示 */}
        <div className="glass-card p-5 mb-5" style={{ borderColor: 'rgba(14,165,233,0.25)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>当前可提现余额</p>
          <p className="font-mono text-3xl font-bold" style={{ color: 'var(--accent-text)' }}>
            ¥{balance.toFixed(2)}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit}>
          <div className="glass-card p-5 mb-4 flex flex-col gap-6">
            {/* 提现金额 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                提现金额（最低 50 元）
              </label>
              <input
                type="number"
                min={50}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="请输入提现金额"
                className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none"
                style={{
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                }}
                required
              />
            </div>

            {/* 收款方式 */}
            <div>
              <label className="block text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>收款方式</label>
              <div className="flex gap-3">
                {(['alipay', 'wechat'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="flex-1 py-2.5 text-sm rounded-xl transition-all duration-300 ease-out"
                    style={{
                      background: payeeMethod === m ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.05)',
                      border: payeeMethod === m ? '1px solid rgba(14,165,233,0.35)' : '1px solid var(--glass-border)',
                      color: payeeMethod === m ? 'var(--accent-text)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPayeeMethod(m)}
                  >
                    {m === 'alipay' ? '支付宝' : '微信'}
                  </button>
                ))}
              </div>
            </div>

            {/* 真实姓名 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>真实姓名</label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="请输入真实姓名（与收款账号一致）"
                className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none"
                style={{
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                }}
                required
              />
            </div>

            {/* 收款账号 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>收款账号</label>
              <input
                type="text"
                value={payeeAccount}
                onChange={(e) => setPayeeAccount(e.target.value)}
                placeholder={payeeMethod === 'wechat' ? '微信号或绑定手机号' : '支付宝账号或绑定手机号'}
                className="glass-input w-full px-4 py-3 rounded-xl text-base outline-none"
                style={{
                  color: 'var(--text-primary)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--glass-border)',
                }}
                required
              />
            </div>
          </div>

          {error && (
            <motion.p
              className="text-sm mb-4 text-center"
              style={{ color: '#f43f5e' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '确认提现'}
          </Button>
        </form>

        <p className="text-xs mt-6 px-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          本平台采用单级分销机制，仅对您直接邀请的用户付费行为给予一次性佣金奖励，不存在多级返佣。提现审核通过后 1–3 个工作日内打款。
        </p>
      </motion.div>
    </div>
  )
}

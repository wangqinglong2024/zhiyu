/**
 * 提现申请页面：填写提现信息并提交
 * 先拉取当前可提现余额，提交后跳回 /profile
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import MeshBackground from '../components/layout/MeshBackground'
import Button from '../components/common/Button'
import { getBalance } from '../api/commissions'
import { applyWithdrawal } from '../api/withdrawals'
import { useAuth } from '../hooks/useAuth'

export default function WithdrawPage() {
  useAuth()
  const navigate = useNavigate()

  /* ── 表单状态 ── */
  const [amount, setAmount] = useState('')
  const [payeeMethod, setPayeeMethod] = useState<'wechat' | 'alipay'>('alipay')
  const [payeeName, setPayeeName] = useState('')
  const [payeeAccount, setPayeeAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  /* ── 查询余额 ── */
  const { data: balanceData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getBalance().then((r) => r.data.data),
  })
  const balance = balanceData?.wallet?.balance ?? 0

  /* ── 提交处理 ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 50) {
      setError('提现金额最低 50 元')
      return
    }
    if (amountNum > balance) {
      setError('提现金额不能超过可提现余额')
      return
    }
    if (!payeeName.trim()) {
      setError('请填写真实姓名')
      return
    }
    if (!payeeAccount.trim()) {
      setError('请填写收款账号')
      return
    }

    setSubmitting(true)
    try {
      await applyWithdrawal({
        amount: amountNum,
        payee_name: payeeName.trim(),
        payee_account: payeeAccount.trim(),
        payee_method: payeeMethod,
      })
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  /* ── 成功状态 ── */
  if (submitted) {
    return (
      <div className="min-h-screen px-5 pt-12 pb-24 max-w-app mx-auto flex flex-col items-center justify-center">
        <MeshBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="glass-panel p-8 w-full text-center"
        >
          <div className="text-4xl mb-4">✓</div>
          <p className="text-lg font-semibold mb-2" style={{ color: 'var(--success)' }}>
            申请已提交
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            提现申请已提交，预计 1-3 个工作日到账
          </p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/profile')}>
            返回我的页面
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-12 pb-24 max-w-app mx-auto">
      <MeshBackground />
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* 顶部导航 */}
        <div className="flex items-center mb-8">
          <button
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
          >
            ← 返回
          </button>
          <h1 className="flex-1 text-center text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            申请提现
          </h1>
          <div style={{ width: 48 }} />
        </div>

        {/* 余额展示 */}
        <div className="glass-panel p-5 mb-6">
          <p className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>当前可提现余额</p>
          <p className="font-num text-3xl font-bold" style={{ color: 'var(--text-gold)' }}>
            ¥{balance.toFixed(2)}
          </p>
        </div>

        {/* 提现表单 */}
        <form onSubmit={handleSubmit}>
          <div className="glass-panel p-5 mb-4 flex flex-col gap-5">

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
                className="input-underline w-full"
                required
              />
            </div>

            {/* 收款方式 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                收款方式
              </label>
              <select
                value={payeeMethod}
                onChange={(e) => setPayeeMethod(e.target.value as 'wechat' | 'alipay')}
                className="input-underline w-full"
                style={{ background: 'transparent', color: 'var(--text-primary)' }}
              >
                <option value="alipay" style={{ background: '#1a1a2e' }}>支付宝</option>
                <option value="wechat" style={{ background: '#1a1a2e' }}>微信</option>
              </select>
            </div>

            {/* 真实姓名 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                真实姓名
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="请输入真实姓名（与收款账号一致）"
                className="input-underline w-full"
                required
              />
            </div>

            {/* 收款账号 */}
            <div>
              <label className="block text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                收款账号
              </label>
              <input
                type="text"
                value={payeeAccount}
                onChange={(e) => setPayeeAccount(e.target.value)}
                placeholder={payeeMethod === 'wechat' ? '微信号或绑定手机号' : '支付宝账号或绑定手机号'}
                className="input-underline w-full"
                required
              />
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm mb-4 text-center" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          )}

          {/* 提交按钮 */}
          <Button
            variant="primary"
            className="w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? '提交中...' : '确认提现'}
          </Button>
        </form>

        {/* 合规说明 */}
        <div className="mt-6 px-2">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            合规说明：本平台采用单级分销机制，仅对您直接邀请的用户付费行为给予一次性佣金奖励，不存在多级返佣、拉人头等行为。
            提现将在审核通过后 1-3 个工作日内打款至您的收款账号。
          </p>
        </div>
      </motion.div>
    </div>
  )
}

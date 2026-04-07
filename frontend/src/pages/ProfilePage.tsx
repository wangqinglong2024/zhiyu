/**
 * 我的页面：历史报告 + 钱包余额 + 邀请入口 + 提现入口
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Button from '../components/common/Button'
import ThemeToggle from '../components/common/ThemeToggle'
import { getMyOrders } from '../api/orders'
import { getBalance } from '../api/commissions'
import { getMe } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'

const STATUS_LABEL: Record<string, string> = {
  pending:    '待支付',
  paid:       '已支付',
  generating: '生成中',
  completed:  '已完成',
  failed:     '生成失败',
  refunded:   '已退款',
}

const STATUS_COLOR: Record<string, string> = {
  completed: '#22c55e',
  failed:    '#f43f5e',
  refunded:  'var(--text-muted)',
}

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: 'easeOut', delay: i * 0.07 },
  }),
}

export default function ProfilePage() {
  useAuth()
  const navigate = useNavigate()
  const logout   = useAuthStore((s) => s.logout)
  const [copied, setCopied] = useState(false)

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn:  () => getMyOrders(1).then((r) => r.data.data),
  })

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn:  () => getBalance().then((r) => r.data.data),
  })

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn:  () => getMe().then((r) => r.data.data),
  })

  const wallet     = walletData?.wallet
  const orders     = ordersData?.orders || []
  const inviteCode = meData?.invite_code || ''
  const inviteLink = inviteCode ? `https://ideas.top/invite/${inviteCode}` : ''

  const handleCopyInvite = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="relative min-h-screen px-5 pt-12 pb-28"
      style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
    >
      {/* 右上角主题切换 */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-8">
          <motion.button
            className="text-sm flex items-center gap-1 transition-all duration-300 ease-out"
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/')}
            whileTap={{ scale: 0.94 }}
          >
            ← 首页
          </motion.button>
          <motion.button
            className="btn-ghost text-sm px-4 py-1.5 rounded-full"
            style={{ color: '#f43f5e', cursor: 'pointer' }}
            onClick={() => { logout(); navigate('/login') }}
            whileTap={{ scale: 0.94 }}
          >
            退出
          </motion.button>
        </div>

        {/* 钱包卡片 */}
        <motion.div
          className="glass-card p-6 mb-5"
          style={{ borderColor: 'rgba(14,165,233,0.25)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            我的收益
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span
              className="font-mono text-3xl font-bold"
              style={{ color: 'var(--accent-text)' }}
            >
              ¥{(wallet?.balance ?? 0).toFixed(2)}
            </span>
            <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>
              可提现
            </span>
          </div>
          <div className="flex gap-6 text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
            <span>累计：¥{(wallet?.total_earned ?? 0).toFixed(2)}</span>
            <span>已提：¥{(wallet?.total_withdrawn ?? 0).toFixed(2)}</span>
          </div>
          {(wallet?.balance ?? 0) >= 50 && (
            <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate('/withdraw')}>
              申请提现
            </Button>
          )}
        </motion.div>

        {/* 邀请卡片 */}
        <motion.div
          className="glass-card p-5 mb-5 cursor-pointer"
          style={{ borderColor: 'rgba(225,29,72,0.20)' }}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.4 }}
          whileTap={{ scale: 0.985 }}
          onClick={handleCopyInvite}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent-text)' }}>
                邀请好友得佣金
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                每带来一笔付费，你得 ¥8.64
              </p>
              {inviteCode && (
                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                  邀请码：{inviteCode}
                </p>
              )}
            </div>
            <motion.span
              className="text-sm px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(14,165,233,0.10)',
                border: '1px solid rgba(14,165,233,0.20)',
                color: 'var(--accent-text)',
              }}
              key={copied ? 'copied' : 'copy'}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {copied ? '已复制 ✓' : '复制链接 →'}
            </motion.span>
          </div>
        </motion.div>

        {/* 历史报告 */}
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          历史报告
        </h2>

        {orders.length === 0 ? (
          <motion.p
            className="text-sm text-center py-10"
            style={{ color: 'var(--text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            还没有报告，去生成一份吧 ✦
          </motion.p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                custom={i}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                className="glass-card p-4 cursor-pointer"
                whileTap={{ scale: 0.982 }}
                onClick={() =>
                  order.status === 'completed' ? navigate(`/report/${order.id}`) : undefined
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {order.category === 'career' ? '💼 职场困境' : '💬 情感困境'}
                  </span>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--glass-border)',
                      color: STATUS_COLOR[order.status] || 'var(--text-secondary)',
                    }}
                  >
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>
                    {order.created_at?.slice(0, 10)}
                  </span>
                  <span className="font-mono text-sm font-medium" style={{ color: 'var(--accent-text)' }}>
                    ¥{order.amount.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

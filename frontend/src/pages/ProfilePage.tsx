/**
 * 我的页面：历史报告 + 钱包余额 + 邀请入口 + 提现入口
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import MeshBackground from '../components/layout/MeshBackground'
import Button from '../components/common/Button'
import { getMyOrders } from '../api/orders'
import { getBalance } from '../api/commissions'
import { getMe } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { useAuth } from '../hooks/useAuth'

const STATUS_LABEL: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  generating: '生成中',
  completed: '已完成',
  failed: '生成失败',
  refunded: '已退款',
}

const STATUS_COLOR: Record<string, string> = {
  completed: 'var(--success)',
  failed: 'var(--error)',
  refunded: 'var(--text-muted)',
}

export default function ProfilePage() {
  useAuth()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const { data: ordersData } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => getMyOrders(1).then((r) => r.data.data),
  })

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => getBalance().then((r) => r.data.data),
  })

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => getMe().then((r) => r.data.data),
  })

  const wallet = walletData?.wallet
  const orders = ordersData?.orders || []
  const inviteCode = meData?.invite_code || ''
  const inviteLink = inviteCode ? `https://ideas.top/invite/${inviteCode}` : ''

  const handleCopyInvite = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => alert('邀请链接已复制'))
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
        <div className="flex items-center justify-between mb-8">
          <button
            style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            ← 首页
          </button>
          <button
            className="text-sm"
            style={{ color: 'var(--error)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onClick={() => { logout(); navigate('/login') }}
          >
            退出
          </button>
        </div>

        {/* 钱包卡片 */}
        <div className="glass-panel p-6 mb-6">
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            我的收益
          </p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="font-num text-3xl font-bold" style={{ color: 'var(--text-gold)' }}>
              ¥{(wallet?.balance ?? 0).toFixed(2)}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              可提现
            </span>
          </div>
          <div className="flex gap-6 text-sm font-num" style={{ color: 'var(--text-secondary)' }}>
            <span>累计：¥{(wallet?.total_earned ?? 0).toFixed(2)}</span>
            <span>已提：¥{(wallet?.total_withdrawn ?? 0).toFixed(2)}</span>
          </div>
          {(wallet?.balance ?? 0) >= 50 && (
            <Button
              variant="secondary"
              className="mt-4 w-full"
              onClick={() => navigate('/withdraw')}
            >
              申请提现
            </Button>
          )}
        </div>

        {/* 邀请区 */}
        <div
          className="glass-panel p-5 mb-6 cursor-pointer"
          onClick={handleCopyInvite}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-gold)' }}>
                邀请好友得佣金
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                每带来一笔付费，你得 ¥8.64
              </p>
            </div>
            <span className="text-sm" style={{ color: 'var(--text-gold)' }}>
              复制链接 →
            </span>
          </div>
        </div>

        {/* 历史报告 */}
        <h2 className="text-md font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          历史报告
        </h2>
        {orders.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            还没有报告，去生成一份吧
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                className="glass-panel p-4 cursor-pointer"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  order.status === 'completed' ? navigate(`/report/${order.id}`) : null
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {order.category === 'career' ? '职场困境' : '情感困境'}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: STATUS_COLOR[order.status] || 'var(--text-secondary)' }}
                  >
                    {STATUS_LABEL[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-num text-sm" style={{ color: 'var(--text-muted)' }}>
                    {order.created_at?.slice(0, 10)}
                  </span>
                  <span className="font-num text-sm" style={{ color: 'var(--text-gold)' }}>
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

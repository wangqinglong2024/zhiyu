/**
 * 支付等待页：轮询订单状态，confirmed 后跳转生成页
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOrderStatus } from '../hooks/useOrderStatus'
import { useAuth } from '../hooks/useAuth'

export default function PayingPage() {
  useAuth()
  const { orderId } = useParams<{ orderId: string }>()
  const navigate    = useNavigate()
  const { data, error } = useOrderStatus(orderId)

  useEffect(() => {
    if (!data) return
    if (data.status === 'paid' || data.status === 'generating') {
      navigate(`/generating/${orderId}`, { replace: true })
    } else if (data.status === 'completed') {
      navigate(`/report/${orderId}`, { replace: true })
    }
  }, [data, orderId, navigate])

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-5"
      style={{ zIndex: 2 }}
    >
      <motion.div
        className="text-center w-full"
        style={{ maxWidth: 420 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="glass-card p-10 flex flex-col items-center gap-6">
          {/* 双层旋转指示器 */}
          <div className="relative w-16 h-16">
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border"
              style={{ borderColor: 'rgba(225,29,72,0.25)', borderTopColor: '#fb7185' }}
              animate={{ rotate: -360 }}
              transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
            />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              正在确认支付
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {error ? (typeof error === 'string' ? error : '确认失败') : '请稍候，支付确认通常在 10 秒内完成'}
            </p>
          </div>

          {error && (
            <motion.button
              className="btn-glass text-sm px-5 py-2"
              onClick={() => window.location.reload()}
              whileTap={{ scale: 0.94 }}
            >
              点击刷新
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

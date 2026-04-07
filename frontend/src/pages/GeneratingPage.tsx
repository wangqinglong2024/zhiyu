/**
 * AI 生成中页：进度动画 + 轮询跳转
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useOrderStatus } from '../hooks/useOrderStatus'
import { useAuth } from '../hooks/useAuth'

const steps = [
  { text: '理解你的困境...' },
  { text: '识别核心症结...' },
  { text: '推演三条路径...' },
  { text: '生成认知升维...' },
]

export default function GeneratingPage() {
  useAuth()
  const { orderId } = useParams<{ orderId: string }>()
  const navigate    = useNavigate()
  const { data }    = useOrderStatus(orderId)

  useEffect(() => {
    if (data?.status === 'completed') {
      navigate(`/report/${orderId}`, { replace: true })
    } else if (data?.status === 'failed') {
      navigate(`/analyze/career?retry=${orderId}`, { replace: true })
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
        transition={{ duration: 0.5 }}
      >
        {/* 双层旋转光环 */}
        <div className="relative w-28 h-28 mx-auto mb-10">
          {/* 外环（慢转） */}
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: 'rgba(14,165,233,0.25)', borderTopColor: '#0ea5e9', borderWidth: 1.5 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 4, ease: 'linear', repeat: Infinity }}
          />
          {/* 内环（快转，反向） */}
          <motion.div
            className="absolute inset-3 rounded-full border"
            style={{ borderColor: 'rgba(253,166,175,0.25)', borderBottomColor: '#fda4af', borderWidth: 1 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
          />
          {/* 中心光晕 */}
          <motion.div
            className="absolute inset-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(14,165,233,0.10)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          >
            <span style={{ color: 'var(--accent-text)', fontSize: 20 }}>✦</span>
          </motion.div>
        </div>

        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          AI 正在分析中
        </h2>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          通常需要 30–60 秒，请耐心等待
        </p>

        {/* 步骤卡片 */}
        <div className="glass-card p-6 max-w-xs mx-auto">
          <div className="flex flex-col gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.text}
                className="flex items-center gap-3 text-sm"
                initial={{ opacity: 0.25 }}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 2.4,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  delay: i * 0.6,
                }}
              >
                <motion.span
                  style={{ color: 'var(--accent)', fontSize: 10 }}
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.6 }}
                >
                  ●
                </motion.span>
                <span style={{ color: 'var(--text-secondary)' }}>{step.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * 报告展示页：核心症结 + 三条路径 + 认知升维
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReportCard from '../components/report/ReportCard'
import Disclaimer from '../components/common/Disclaimer'
import Button from '../components/common/Button'
import ThemeToggle from '../components/common/ThemeToggle'
import { getOrderStatus } from '../api/orders'
import type { ReportData } from '../types/api'
import { useAuth } from '../hooks/useAuth'

export default function ReportPage() {
  useAuth()
  const { orderId } = useParams<{ orderId: string }>()
  const navigate    = useNavigate()
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (!orderId) return
    getOrderStatus(orderId)
      .then((res) => {
        const data = res.data.data
        if (data?.status === 'completed' && data.report) {
          setReport(data.report as ReportData)
        } else if (data?.status === 'failed') {
          setError('报告生成失败，请联系客服')
        } else {
          setError('报告还未生成，请稍候')
        }
      })
      .catch(() => setError('加载失败，请刷新重试'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center" style={{ zIndex: 2 }}>
        <div className="relative w-14 h-14">
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: 'rgba(14,165,233,0.3)', borderTopColor: '#0ea5e9' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-2 rounded-full border"
            style={{ borderColor: 'rgba(253,166,175,0.25)', borderTopColor: '#fda4af' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 2, ease: 'linear', repeat: Infinity }}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen px-5 pt-12 pb-32"
      style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
    >
      <div className="fixed top-5 right-5 z-50"><ThemeToggle /></div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38 }}
      >
        {/* 返回按钮 */}
        <motion.button
          className="text-sm mb-6 flex items-center gap-1 transition-all duration-300 ease-out"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
          whileTap={{ scale: 0.94 }}
        >
          ← 我的报告
        </motion.button>

        {/* 页眉 */}
        <div className="mb-8">
          <h1
            className="text-xl font-semibold mb-1 tracking-wider"
            style={{ color: 'var(--accent-text)' }}
          >
            你的认知分析报告
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            由 AI 深度分析生成 · 仅供参考
          </p>
        </div>

        {error && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm" style={{ color: '#f43f5e' }}>{error}</p>
          </div>
        )}

        {report && <ReportCard report={report} />}
      </motion.div>

      {/* 底部操作栏 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-5 pb-8 pt-6"
        style={{
          zIndex: 10,
          background: 'linear-gradient(transparent, var(--bg-overlay) 40%, var(--bg) 100%)',
        }}
      >
        <div className="max-w-sm mx-auto flex flex-col gap-3">
          <Button onClick={() => navigate('/')}>再分析一个困境</Button>
          <Disclaimer type="report" />
        </div>
      </div>
    </div>
  )
}

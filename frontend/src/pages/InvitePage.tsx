/**
 * 邀请落地页：展示邀请人、引导注册
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/common/Button'
import Disclaimer from '../components/common/Disclaimer'
import ThemeToggle from '../components/common/ThemeToggle'

const features = [
  { text: '核心症结 — 看清问题本质' },
  { text: '三条路径 — 每条的优劣分析' },
  { text: '认知升维 — 突破思维局限' },
]

export default function InvitePage() {
  const { code }  = useParams<{ code: string }>()
  const navigate  = useNavigate()

  return (
    <div
      className="relative min-h-screen flex items-center justify-center px-5"
      style={{ zIndex: 2 }}
    >
      <div className="fixed top-5 right-5 z-50"><ThemeToggle /></div>

      {/* 装饰性浮动玻璃块（3-4 个） */}
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          top: '15%',
          right: '8%',
          background: 'rgba(253,230,138,0.08)',
          border: '1px solid rgba(253,230,138,0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1rem',
          animationDelay: '1s',
        }}
      />
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 44,
          height: 44,
          bottom: '20%',
          left: '6%',
          background: 'rgba(14,165,233,0.08)',
          border: '1px solid rgba(14,165,233,0.15)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.875rem',
          animationDelay: '2.5s',
        }}
      />
      <div
        className="glass-decor"
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          top: '45%',
          left: '10%',
          background: 'rgba(225,29,72,0.06)',
          border: '1px solid rgba(225,29,72,0.12)',
          backdropFilter: 'blur(8px)',
          borderRadius: '0.75rem',
          animationDelay: '4s',
        }}
      />

      <motion.div
        className="w-full text-center"
        style={{ maxWidth: 420 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo 光晕 */}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-7"
          style={{
            background: 'rgba(14,165,233,0.12)',
            border: '1px solid rgba(14,165,233,0.25)',
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(14,165,233,0.15)',
              '0 0 40px rgba(14,165,233,0.25)',
              '0 0 20px rgba(14,165,233,0.15)',
            ],
          }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
        >
          ✦
        </motion.div>

        <h1
          className="text-xl font-bold mb-3 tracking-widest"
          style={{ color: 'var(--accent-text)' }}
        >
          内观 · AI 认知镜
        </h1>
        <p className="text-base mb-2" style={{ color: 'var(--text-primary)' }}>
          你的朋友邀请你来看清困境
        </p>
        <p className="text-sm mb-10" style={{ color: 'var(--text-secondary)' }}>
          描述你的职场或情感困境，AI 为你生成
          <br />
          一份深度认知分析报告 · 仅需 ¥28.8
        </p>

        {/* 功能卡片 */}
        <div
          className="glass-card p-6 mb-8 text-left"
          style={{ borderColor: 'rgba(14,165,233,0.20)' }}
        >
          <p
            className="text-sm font-medium mb-4 tracking-widest"
            style={{ color: 'var(--accent-text)' }}
          >
            报告包含
          </p>
          <div className="flex flex-col gap-3">
            {features.map((f, i) => (
              <motion.div
                key={f.text}
                className="flex items-center gap-3 text-sm"
                style={{ color: 'var(--text-secondary)' }}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
              >
                <span style={{ color: 'var(--accent)', fontSize: 10 }}>●</span>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>

        <Button onClick={() => navigate(`/login?invite=${code}`)}>
          立即体验
        </Button>

        <Disclaimer type="invite" className="mt-6" />
      </motion.div>
    </div>
  )
}

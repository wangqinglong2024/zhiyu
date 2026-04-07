/**
 * 输入困境页：文本域 + 字数统计 + 付款按钮
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Disclaimer from '../components/common/Disclaimer'
import ThemeToggle from '../components/common/ThemeToggle'
import { createOrder } from '../api/orders'
import { useAuth } from '../hooks/useAuth'

const CATEGORY_LABEL: Record<string, { label: string; hint: string }> = {
  career:  { label: '职场困境', hint: '例如：在公司做了三年，感觉一直没有晋升机会，和直属领导关系也很紧张...' },
  emotion: { label: '情感困境', hint: '例如：和伴侣越来越无话可说，感觉关系陷入了僵局，不知道该怎么办...' },
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export default function AnalyzePage() {
  useAuth()
  const { category = 'career' } = useParams<{ category: string }>()
  const navigate  = useNavigate()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const meta      = CATEGORY_LABEL[category] ?? CATEGORY_LABEL.career
  const charCount = content.trim().length
  const isReady   = charCount >= 20

  const handlePay = async () => {
    if (!isReady) { setError('请至少输入 20 个字符描述你的困境'); return }
    setLoading(true)
    setError('')
    try {
      const res = await createOrder(category, content.trim())
      const { pay_url } = res.data.data!
      window.location.href = pay_url
    } catch (e: any) {
      setError(e.response?.data?.message || '下单失败，请稍后重试')
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen px-5 pt-12 pb-8 flex flex-col"
      style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
    >
      {/* 右上角主题切换 */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        className="flex flex-col flex-1"
        variants={pageVariants}
        initial="initial"
        animate="animate"
      >
        {/* 返回 */}
        <motion.button
          className="text-sm mb-8 self-start flex items-center gap-1 transition-all duration-300 ease-out"
          style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/')}
          whileTap={{ scale: 0.94 }}
        >
          ← 返回
        </motion.button>

        {/* 页面标题 */}
        <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
          {meta.label}
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          请详细描述你正在面对的困境。越具体，分析越精准。
        </p>

        {/* 文本域（玻璃风格） */}
        <div className="relative flex-1 flex flex-col">
          <textarea
            className="glass w-full flex-1 min-h-[220px] p-5 text-base resize-none outline-none glass-input"
            style={{
              color: 'var(--text-primary)',
              caretColor: 'var(--accent)',
              lineHeight: '1.75',
              borderRadius: '1.25rem',
            }}
            placeholder={meta.hint}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
          {/* 字数进度条 */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <div
              className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'var(--glass-border)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isReady
                    ? 'linear-gradient(90deg, #0284c7, #0ea5e9)'
                    : '#f43f5e',
                  transformOrigin: 'left',
                }}
                animate={{ scaleX: Math.min(charCount / 2000, 1) }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p
              className="text-xs font-mono flex-shrink-0"
              style={{ color: !isReady ? '#f43f5e' : 'var(--text-muted)' }}
            >
              {charCount} / 2000
            </p>
          </div>
        </div>

        {error && (
          <motion.p
            className="text-sm mt-3"
            style={{ color: '#f43f5e' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* 付款按钮 */}
        <div className="mt-6">
          <motion.button
            className="btn-primary w-full py-4 text-base font-semibold text-white"
            onClick={handlePay}
            disabled={loading || !isReady}
            whileTap={{ scale: 0.97 }}
            style={{ opacity: loading || !isReady ? 0.6 : 1 }}
          >
            {loading ? '处理中...' : '支付 ¥28.8 · 生成我的报告'}
          </motion.button>
          <Disclaimer type="input" className="mt-3" />
        </div>
      </motion.div>
    </div>
  )
}

/**
 * 首页：选择分析类目（职场 / 情感）
 * 背景层由 App.tsx 全局注入，本页内容在 z:2
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ThemeToggle from '../components/common/ThemeToggle'
import { useAuth } from '../hooks/useAuth'

const categories = [
  {
    id: 'career',
    icon: '💼',
    title: '职场困境',
    desc: '职业迷茫、晋升卡关、同事关系、职场压力',
    glowBg: 'rgba(14,165,233,0.10)',
    glowBorder: 'rgba(14,165,233,0.20)',
  },
  {
    id: 'emotion',
    icon: '💬',
    title: '情感困境',
    desc: '感情迷茫、关系撕裂、家庭矛盾、自我迷失',
    glowBg: 'rgba(225,29,72,0.10)',
    glowBorder: 'rgba(225,29,72,0.20)',
  },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const cardVariants = {
  initial: { opacity: 0, y: 16, scale: 0.97 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut', delay: 0.15 + i * 0.1 },
  }),
}

export default function HomePage() {
  useAuth()
  const navigate = useNavigate()

  return (
    <div
      className="relative min-h-screen px-5 pt-14 pb-24"
      style={{ zIndex: 2, maxWidth: 420, margin: '0 auto' }}
    >
      {/* 右上角主题切换 */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <motion.div variants={pageVariants} initial="initial" animate="animate">

        {/* 标题区 */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-2xl font-bold mb-3 tracking-widest"
            style={{ color: 'var(--accent-text)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4 }}
          >
            内观
          </motion.h1>
          <p className="text-base mb-5" style={{ color: 'var(--text-secondary)' }}>
            描述你的困境，AI 为你生成
            <br />
            一份深度认知分析报告
          </p>
          {/* 价格徽章 */}
          <motion.span
            className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(14,165,233,0.12)',
              border: '1px solid rgba(14,165,233,0.25)',
              color: 'var(--accent-text)',
              backdropFilter: 'blur(8px)',
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.35 }}
          >
            ¥28.8 / 份
          </motion.span>
        </div>

        {/* 类目卡片 */}
        <div className="flex flex-col gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              custom={i}
              variants={cardVariants}
              initial="initial"
              animate="animate"
              whileTap={{ scale: 0.97, transition: { type: 'spring', stiffness: 300, damping: 22 } }}
              className="glass-card p-6 cursor-pointer"
              onClick={() => navigate(`/analyze/${cat.id}`)}
            >
              <div className="flex items-center gap-4">
                {/* 图标容器 */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: cat.glowBg,
                    border: `1px solid ${cat.glowBorder}`,
                  }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {cat.title}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {cat.desc}
                  </p>
                </div>
                {/* 箭头 */}
                <span style={{ color: 'var(--text-muted)', fontSize: 20 }}>›</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 我的入口 */}
        <div className="text-center mt-10">
          <motion.button
            className="btn-ghost px-5 py-2 text-sm rounded-full"
            style={{ color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => navigate('/profile')}
            whileTap={{ scale: 0.94 }}
          >
            我的报告与收益 →
          </motion.button>
        </div>

      </motion.div>
    </div>
  )
}

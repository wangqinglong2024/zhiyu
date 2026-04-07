/**
 * 主题切换按钮（圆形玻璃风格）
 * 暗色 → ☀️   亮色 → 🌙
 */
import { motion } from 'framer-motion'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore()

  return (
    <motion.button
      className="theme-toggle"
      onClick={toggle}
      whileTap={{ scale: 0.88, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      title={theme === 'dark' ? '切换亮色' : '切换暗色'}
    >
      <motion.span
        key={theme}
        initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
        animate={{ opacity: 1, rotate: 0,   scale: 1   }}
        exit={{ opacity: 0, rotate: 30,   scale: 0.7 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{ fontSize: 16, lineHeight: 1, display: 'block' }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </motion.span>
    </motion.button>
  )
}

/**
 * 报告展示卡片（核心症结 / 三条路径 / 认知升维）
 * Sky accent 边框 + glass shadow，遵循 Rose + Sky + Amber 三色体系
 */
import { motion } from 'framer-motion'
import type { ReportData } from '../../types/api'

interface Props {
  report: ReportData
}

const cardVariants = {
  initial: { opacity: 0, y: 12 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut', delay: i * 0.1 },
  }),
}

export default function ReportCard({ report }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* 核心症结 */}
      <motion.div
        className="report-module"
        custom={0}
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <h3 className="report-section-title mb-4">核心症结</h3>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {report.core_issue}
        </p>
      </motion.div>

      {/* 三条路径 */}
      <motion.div
        className="report-module"
        custom={1}
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <h3 className="report-section-title mb-4">三条路径</h3>
        <div className="flex flex-col gap-4">
          {report.paths.map((path, idx) => (
            <div key={idx} className="border-l-2 pl-4" style={{ borderColor: 'var(--border-sky)' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--text-sky)' }}>
                {idx + 1}. {path.title}
              </p>
              <p className="text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                {path.content}
              </p>
              <div className="flex gap-4 text-sm">
                <span style={{ color: 'var(--success)' }}>优势：{path.pros}</span>
                <span style={{ color: 'var(--error)' }}>代价：{path.cons}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 认知升维 */}
      <motion.div
        className="report-module"
        custom={2}
        variants={cardVariants}
        initial="initial"
        animate="animate"
      >
        <h3 className="report-section-title mb-4">认知升维</h3>
        <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {report.upgrade}
        </p>
      </motion.div>

      {/* 金句 */}
      {report.quote && (
        <motion.div
          className="py-6 px-5 text-center"
          custom={3}
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <p
            className="text-lg font-semibold italic leading-relaxed"
            style={{ color: 'var(--text-sky)', letterSpacing: '0.04em' }}
          >
            "{report.quote}"
          </p>
        </motion.div>
      )}
    </div>
  )
}

import type { FC } from 'react'
import { AlertTriangle, WifiOff, Server, FileQuestion } from 'lucide-react'

interface ErrorFallbackProps {
  error?: Error | null
  type?: 'network' | 'server' | 'not_found' | 'unknown'
  onRetry?: () => void
}

export const ErrorFallback: FC<ErrorFallbackProps> = ({ error, type, onRetry }) => {
  const errorType = type || detectErrorType(error)

  const config = {
    network: { icon: WifiOff, title: '网络连接异常', desc: '请检查网络连接后重试' },
    server: { icon: Server, title: '服务器繁忙', desc: '服务器正在维护中，请稍后重试' },
    not_found: { icon: FileQuestion, title: '页面不存在', desc: '您访问的页面不存在' },
    unknown: { icon: AlertTriangle, title: '出了点问题', desc: '请刷新页面或稍后重试' },
  }

  const { icon: Icon, title, desc } = config[errorType]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-8">
      <Icon size={48} strokeWidth={1} className="text-[var(--color-text-tertiary)] mb-4" />
      <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">{title}</h2>
      <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">{desc}</p>
      {errorType === 'not_found' ? (
        <a href="/" className="btn-primary px-6">返回首页</a>
      ) : onRetry ? (
        <button className="btn-primary px-6" onClick={onRetry}>重试</button>
      ) : (
        <button className="btn-primary px-6" onClick={() => window.location.reload()}>刷新页面</button>
      )}
    </div>
  )
}

function detectErrorType(error?: Error | null): 'network' | 'server' | 'not_found' | 'unknown' {
  if (!error) return 'unknown'
  const msg = error.message.toLowerCase()
  if (msg.includes('network') || msg.includes('fetch')) return 'network'
  if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return 'server'
  if (msg.includes('404') || msg.includes('not found')) return 'not_found'
  return 'unknown'
}

ErrorFallback.displayName = 'ErrorFallback'

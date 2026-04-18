import { type FC, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CreditCard, Coins, X, Loader2 } from 'lucide-react'
import { useLevelPreview, usePaddlePurchase, useCoinExchange, usePurchaseStatus } from '../hooks/useCourse'

export const PaywallPage: FC = () => {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const { data: level } = useLevelPreview(levelId!)
  const { data: purchaseStatus } = usePurchaseStatus(levelId!)
  const paddlePurchase = usePaddlePurchase()
  const coinExchangeMut = useCoinExchange()
  const [showCoinConfirm, setShowCoinConfirm] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  // 已购买则跳转
  if (purchaseStatus?.is_purchased) {
    navigate(`/courses/levels/${levelId}`, { replace: true })
    return null
  }

  const handlePaddlePay = () => {
    const idempotencyKey = `paddle-${levelId}-${Date.now()}`
    setPaymentStatus('processing')
    paddlePurchase.mutate(
      { levelId: levelId!, idempotencyKey },
      {
        onSuccess: (data) => {
          // 打开 Paddle Checkout
          window.open(data.checkout_url, '_blank')
          setPaymentStatus('idle')
        },
        onError: () => setPaymentStatus('error'),
      },
    )
  }

  const handleCoinExchange = () => {
    const idempotencyKey = `coin-${levelId}-${Date.now()}`
    setPaymentStatus('processing')
    coinExchangeMut.mutate(
      { levelId: levelId!, idempotencyKey },
      {
        onSuccess: () => {
          setPaymentStatus('success')
          setShowCoinConfirm(false)
          setTimeout(() => navigate(`/courses/levels/${levelId}`, { replace: true }), 1500)
        },
        onError: () => setPaymentStatus('error'),
      },
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部 */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm">解锁课程</h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col">
        {/* Level 信息 */}
        {level && (
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#e11d48] to-[#d97706] flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">{level.level_number}</span>
            </div>
            <h2 className="text-lg font-bold">Level {level.level_number} · {level.title_zh}</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{level.subtitle_zh}</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {level.total_units} 单元 · {level.total_lessons} 课时 · HSK {level.hsk_level}
            </p>
          </div>
        )}

        {/* 购买选项 */}
        <div className="space-y-3 flex-1">
          {/* Paddle 支付 */}
          <button
            onClick={handlePaddlePay}
            disabled={paymentStatus === 'processing'}
            className="glass-card p-4 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-[#0284c7]/10 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-[#0284c7]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">在线支付</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                ${level?.price_usd?.toFixed(2) ?? '—'} USD
              </p>
            </div>
          </button>

          {/* 知语币兑换 */}
          <button
            onClick={() => setShowCoinConfirm(true)}
            disabled={paymentStatus === 'processing'}
            className="glass-card p-4 w-full text-left flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-[#d97706]/10 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-[#d97706]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">知语币兑换</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                {level?.coin_price ?? 600} 知语币
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 知语币确认弹层 */}
      {showCoinConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="glass-card w-full max-w-lg rounded-t-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">确认兑换</h3>
              <button onClick={() => setShowCoinConfirm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              确认使用 {level?.coin_price ?? 600} 知语币兑换 Level {level?.level_number}？
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCoinConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleCoinExchange}
                disabled={paymentStatus === 'processing'}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#d97706] to-[#e11d48] text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                {paymentStatus === 'processing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '确认兑换'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 支付状态覆盖层 */}
      {paymentStatus === 'success' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-card p-8 rounded-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold">兑换成功！</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">正在跳转...</p>
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-card p-8 rounded-2xl text-center">
            <p className="font-semibold text-[#ef4444]">支付失败</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">请稍后重试</p>
            <button
              onClick={() => setPaymentStatus('idle')}
              className="mt-4 px-6 py-2 rounded-xl border border-[var(--color-border)] text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

PaywallPage.displayName = 'PaywallPage'

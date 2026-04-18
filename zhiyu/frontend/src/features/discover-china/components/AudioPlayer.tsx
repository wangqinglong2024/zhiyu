import { type FC, useState, useCallback, useRef } from 'react'
import { Play, Pause } from 'lucide-react'

interface AudioPlayerProps {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onChangeRate: (rate: number) => void
}

const RATES = [0.5, 1, 1.5, 2]

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export const AudioPlayer: FC<AudioPlayerProps> = ({
  isPlaying, currentTime, duration, playbackRate,
  onTogglePlay, onSeek, onChangeRate,
}) => {
  const [showRates, setShowRates] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(pct * duration)
  }, [duration, onSeek])

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-[calc(var(--tab-bar-height,56px)+env(safe-area-inset-bottom))]
      left-0 right-0 z-40 glass-elevated px-4 py-3">
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          className="w-11 h-11 flex items-center justify-center rounded-full
            bg-[var(--color-rose)]/10 text-[var(--color-rose)]"
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        {/* Progress */}
        <div className="flex-1">
          <div
            ref={progressRef}
            className="h-1 rounded-full bg-[var(--color-text-tertiary)]/20 cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full rounded-full bg-[var(--color-rose)] transition-[width] duration-100"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[var(--color-text-tertiary)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback rate */}
        <div className="relative">
          <button
            className="text-xs text-[var(--color-text-secondary)] font-medium px-2 py-1
              rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setShowRates(v => !v)}
          >
            {playbackRate}x
          </button>
          {showRates && (
            <div className="absolute bottom-full right-0 mb-2 glass-elevated rounded-xl p-1 flex flex-col min-w-[60px]">
              {RATES.map(r => (
                <button
                  key={r}
                  className={`px-3 py-1.5 text-xs rounded-lg text-center transition-colors
                    ${r === playbackRate ? 'text-[var(--color-rose)] font-medium' : 'text-[var(--color-text-primary)]'}`}
                  onClick={() => { onChangeRate(r); setShowRates(false) }}
                >
                  {r}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

AudioPlayer.displayName = 'AudioPlayer'

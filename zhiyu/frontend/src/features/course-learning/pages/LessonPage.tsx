import { type FC, useEffect, useRef, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Volume2, VolumeX, Check } from 'lucide-react'
import { useLesson, useSaveLessonProgress, useUpdateLessonStatus } from '../hooks/useCourse'

const AUTO_SAVE_INTERVAL = 30_000 // 30s

export const LessonPage: FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { data: lesson, isLoading, error } = useLesson(lessonId!)
  const saveProgress = useSaveLessonProgress()
  const updateStatus = useUpdateLessonStatus()

  const startTimeRef = useRef(Date.now())
  const scrollRef = useRef<HTMLDivElement>(null)
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 自动保存
  useEffect(() => {
    if (!lessonId) return

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const scrollPosition = scrollRef.current?.scrollTop ?? 0

      saveProgress.mutate({
        lessonId,
        data: {
          scroll_position: scrollPosition,
          study_seconds_delta: elapsed,
        },
      })
      startTimeRef.current = Date.now()
    }, AUTO_SAVE_INTERVAL)

    return () => clearInterval(interval)
  }, [lessonId])

  // 标记开始学习
  useEffect(() => {
    if (lesson && lesson.status === 'not_started') {
      updateStatus.mutate({ lessonId: lessonId!, status: 'in_progress' })
    }
  }, [lesson?.status])

  // 恢复滚动位置
  useEffect(() => {
    if (lesson?.resume_data && scrollRef.current) {
      const pos = (lesson.resume_data as Record<string, unknown>).scroll_position
      if (typeof pos === 'number') {
        scrollRef.current.scrollTop = pos
      }
    }
  }, [lesson?.resume_data])

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    const audio = new Audio(url)
    audioRef.current = audio
    setAudioPlaying(url)
    audio.play()
    audio.onended = () => setAudioPlaying(null)
  }, [])

  const handleComplete = () => {
    // 保存最终进度
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    saveProgress.mutate({ lessonId: lessonId!, data: { study_seconds_delta: elapsed } })
    updateStatus.mutate(
      { lessonId: lessonId!, status: 'completed' },
      { onSuccess: () => navigate(-1) },
    )
  }

  if (isLoading) return <LessonSkeleton />
  if (error || !lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">
        加载失败
      </div>
    )
  }

  const content = lesson.content as Record<string, unknown>
  const sections = (content?.sections as unknown[]) ?? []
  const vocabulary = (content?.vocabulary as unknown[]) ?? []

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10 glass-card px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-sm flex-1 truncate">{lesson.title_zh}</h1>
      </div>

      {/* 内容区域 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* 段落内容 */}
        {sections.map((section, i) => {
          const s = section as Record<string, unknown>
          return (
            <div key={i} className="space-y-2">
              {s.title && (
                <h2 className="font-semibold text-base">{String(s.title)}</h2>
              )}
              {s.content_zh && (
                <p className="text-sm leading-relaxed">{String(s.content_zh)}</p>
              )}
              {s.content_en && (
                <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">{String(s.content_en)}</p>
              )}
              {s.audio_url && (
                <button
                  onClick={() => playAudio(String(s.audio_url))}
                  className="flex items-center gap-1.5 text-xs text-[#0284c7] mt-1"
                >
                  {audioPlaying === String(s.audio_url) ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  播放音频
                </button>
              )}
            </div>
          )
        })}

        {/* 词汇卡片轮播 */}
        {vocabulary.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm mb-3">核心词汇</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {vocabulary.map((vocab, i) => {
                const v = vocab as Record<string, unknown>
                return (
                  <div key={i} className="glass-card p-4 min-w-[240px] snap-start shrink-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">{String(v.word || v.hanzi || '')}</span>
                      {v.audio_url && (
                        <button onClick={() => playAudio(String(v.audio_url))} className="p-1">
                          <Volume2 className="w-4 h-4 text-[#0284c7]" />
                        </button>
                      )}
                    </div>
                    {v.pinyin && <p className="text-xs text-[#e11d48]">{String(v.pinyin)}</p>}
                    {v.en && <p className="text-xs text-[var(--color-text-secondary)]">{String(v.en)}</p>}
                    {v.example_zh && (
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-2 border-t border-[var(--color-border)] pt-2">
                        {String(v.example_zh)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 底部完成按钮 */}
      {lesson.status !== 'completed' && (
        <div className="sticky bottom-0 p-4 glass-card">
          <button
            onClick={handleComplete}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#0284c7] text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Check className="w-4 h-4" />
            完成课时
          </button>
        </div>
      )}
    </div>
  )
}

const LessonSkeleton: FC = () => (
  <div className="min-h-screen animate-pulse">
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-5 h-5 rounded bg-[var(--color-bg-tertiary)]" />
      <div className="h-5 w-40 rounded bg-[var(--color-bg-tertiary)]" />
    </div>
    <div className="px-4 py-4 space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-1/3 rounded bg-[var(--color-bg-tertiary)]" />
          <div className="h-4 w-full rounded bg-[var(--color-bg-tertiary)]" />
          <div className="h-4 w-4/5 rounded bg-[var(--color-bg-tertiary)]" />
        </div>
      ))}
    </div>
  </div>
)

LessonPage.displayName = 'LessonPage'

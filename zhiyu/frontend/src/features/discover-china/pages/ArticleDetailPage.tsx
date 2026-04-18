import { type FC, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Share2 } from 'lucide-react'
import { useLanguage } from '../../i18n/hooks/use-language'
import { useArticleDetail } from '../hooks/use-article-detail'
import { useAudioPlayer } from '../hooks/use-audio-player'
import { ArticleHeader } from '../components/ArticleHeader'
import { ArticleContent } from '../components/ArticleContent'
import { AudioPlayer } from '../components/AudioPlayer'
import { FontSizeControl } from '../components/FontSizeControl'
import { ArticleDetailSkeleton } from '../components/ArticleDetailSkeleton'
import { SharePreviewSheet } from '../components/share/SharePreviewSheet'
import { generateArticleShareImage } from '../utils/canvas-share'

const FONT_SIZE_KEY = 'article_font_size'

export const ArticleDetailPage: FC = () => {
  const { articleId } = useParams<{ articleId: string }>()
  const navigate = useNavigate()
  const { uiLanguage, explanationLanguage } = useLanguage()

  const { article, isLoading, error } = useArticleDetail(articleId || '')

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY)
    return saved ? Number(saved) : 18
  })

  const handleFontSize = useCallback((size: number) => {
    setFontSize(size)
    localStorage.setItem(FONT_SIZE_KEY, String(size))
  }, [])

  // Audio
  const audioPlayer = useAudioPlayer(article?.audioUrl)

  // Share
  const [shareImage, setShareImage] = useState<Blob | null>(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)

  const handleShare = useCallback(async () => {
    if (!article || shareLoading) return
    setShareLoading(true)
    try {
      const blob = await generateArticleShareImage(article, uiLanguage)
      setShareImage(blob)
      setShareOpen(true)
    } catch {
      // Toast error handled by parent/global
    } finally {
      setShareLoading(false)
    }
  }, [article, uiLanguage, shareLoading])

  if (isLoading) return <ArticleDetailSkeleton />

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8">
        <p className="text-sm text-[var(--color-text-secondary)]">{error || 'Not found'}</p>
        <button
          className="mt-4 px-6 py-2 rounded-full bg-[var(--color-rose)] text-white text-sm"
          onClick={() => navigate(-1)}
        >
          返回
        </button>
      </div>
    )
  }

  // Get translations for current locale
  const zhTranslation = article.translations?.zh
  const localeTranslation = explanationLanguage !== 'zh'
    ? article.translations?.[explanationLanguage]
    : null

  const titleZh = zhTranslation?.title || ''
  const titleLocale = localeTranslation?.title
  const contentZh = zhTranslation?.content || ''
  const contentPinyin = article.translations?.py?.content || undefined
  // Simple approach: split pinyin from content if available
  const contentLocales: Record<string, string> = {}
  for (const [lang, tr] of Object.entries(article.translations || {})) {
    if (lang !== 'zh' && lang !== 'py' && tr.content) contentLocales[lang] = tr.content
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky nav bar */}
      <div className="sticky top-0 z-30 h-14 glass-elevated flex items-center justify-between px-4">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center -ml-2"
          aria-label="Back"
        >
          <ChevronLeft size={24} className="text-[var(--color-text-primary)]" />
        </button>

        <div className="flex items-center gap-1">
          <FontSizeControl value={fontSize} onChange={handleFontSize} />
          <button
            className="w-11 h-11 flex items-center justify-center text-[var(--color-text-secondary)]
              hover:text-[var(--color-text-primary)] transition-colors"
            onClick={handleShare}
            disabled={shareLoading}
            aria-label="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Cover image */}
      {article.coverUrl && (
        <div className="aspect-[21/9] overflow-hidden">
          <img
            src={article.coverUrl}
            alt={titleZh}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-4">
        <ArticleHeader
          titleZh={titleZh}
          titleLocale={titleLocale}
          viewCount={article.viewCount}
          favoriteCount={article.favoriteCount}
          isFavorited={article.isFavorited}
          articleId={article.id}
          publishedAt={article.publishedAt}
          onShare={handleShare}
        />

        <ArticleContent
          contentZh={contentZh}
          contentPinyin={contentPinyin}
          contentLocales={contentLocales}
          fontSize={fontSize}
        />
      </div>

      {/* Audio player */}
      {audioPlayer.hasAudio && (
        <AudioPlayer
          isPlaying={audioPlayer.isPlaying}
          currentTime={audioPlayer.currentTime}
          duration={audioPlayer.duration}
          playbackRate={audioPlayer.playbackRate}
          onTogglePlay={audioPlayer.togglePlay}
          onSeek={audioPlayer.seek}
          onChangeRate={audioPlayer.changeRate}
        />
      )}

      {/* Share Sheet */}
      {shareOpen && shareImage && (
        <SharePreviewSheet
          imageBlob={shareImage}
          title={titleZh}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  )
}

ArticleDetailPage.displayName = 'ArticleDetailPage'

import type { FC } from 'react'
import { ParagraphRenderer } from './ParagraphRenderer'
import { ImageViewer } from './ImageViewer'

interface ArticleContentProps {
  /** Raw HTML content split into blocks */
  contentZh: string
  contentPinyin?: string
  contentLocales?: Record<string, string>
  fontSize: number
}

/**
 * Simple content renderer — splits text by double newlines into paragraphs.
 * For MVP, we treat the content as plain text paragraphs.
 * Images embedded as ![alt](url) markdown syntax are extracted.
 */
export const ArticleContent: FC<ArticleContentProps> = ({
  contentZh, contentPinyin, contentLocales, fontSize,
}) => {
  // Split paragraphs by double newline
  const zhParagraphs = contentZh.split(/\n\n+/)
  const pinyinParagraphs = contentPinyin?.split(/\n\n+/) ?? []
  const localeParagraphsMap: Record<string, string[]> = {}

  if (contentLocales) {
    for (const [lang, text] of Object.entries(contentLocales)) {
      localeParagraphsMap[lang] = text.split(/\n\n+/)
    }
  }

  return (
    <div className="article-content">
      {zhParagraphs.map((zh, i) => {
        // Check if paragraph is an image markdown
        const imgMatch = zh.match(/^!\[(.*?)\]\((.*?)\)$/)
        if (imgMatch?.[2]) {
          return <ImageViewer key={i} src={imgMatch[2]} alt={imgMatch[1] ?? ''} />
        }

        const localeTexts: Record<string, string> = {}
        for (const [lang, paragraphs] of Object.entries(localeParagraphsMap)) {
          if (paragraphs[i]) localeTexts[lang] = paragraphs[i]
        }

        return (
          <ParagraphRenderer
            key={i}
            zhText={zh}
            pinyinText={pinyinParagraphs[i]}
            localeTexts={localeTexts}
            fontSize={fontSize}
          />
        )
      })}
    </div>
  )
}

ArticleContent.displayName = 'ArticleContent'

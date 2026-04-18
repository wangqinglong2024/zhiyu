import type { DailyQuote, ArticleDetail } from '../types/discover-china.types'

const SLOGAN = '知语 Zhiyu — 有趣的中文学习平台'

/**
 * Load an image from URL with crossOrigin support for Canvas
 */
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/**
 * Draw rounded rectangle path
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

/**
 * Wrap text to fit within maxWidth, returns lines
 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const chars = text.split('')
  let line = ''
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = ch
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Generate Daily Quote share image (1080×1920)
 */
export async function generateQuoteImage(quote: DailyQuote): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1920
  const ctx = canvas.getContext('2d')!

  // 1. Background
  if (quote.bgImageUrl) {
    try {
      const bgImg = await loadImage(quote.bgImageUrl)
      // Cover fit
      const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height)
      const w = bgImg.width * scale
      const h = bgImg.height * scale
      ctx.drawImage(bgImg, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    } catch {
      // Fallback gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      grad.addColorStop(0, '#1e293b')
      grad.addColorStop(1, '#0f172a')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, '#1e293b')
    grad.addColorStop(1, '#0f172a')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 2. Glass text area (centered card)
  const cardW = 900
  const cardH = 700
  const cardX = (canvas.width - cardW) / 2
  const cardY = (canvas.height - cardH) / 2 - 60

  roundRect(ctx, cardX, cardY, cardW, cardH, 32)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fill()

  // 3. Quote text
  const textX = canvas.width / 2
  let textY = cardY + 100

  // Chinese quote
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 48px "Noto Sans SC", sans-serif'
  ctx.textAlign = 'center'
  const zhLines = wrapText(ctx, quote.quoteZh, cardW - 120)
  for (const line of zhLines) {
    ctx.fillText(line, textX, textY)
    textY += 68
  }

  // Pinyin
  if (quote.quotePinyin) {
    textY += 10
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = '400 24px Inter, sans-serif'
    const pyLines = wrapText(ctx, quote.quotePinyin, cardW - 120)
    for (const line of pyLines) {
      ctx.fillText(line, textX, textY)
      textY += 36
    }
  }

  // Source
  if (quote.sourceZh) {
    textY += 20
    ctx.fillStyle = '#fde68a' // Amber
    ctx.font = '400 20px "Noto Sans SC", sans-serif'
    ctx.fillText(`—— ${quote.sourceZh}`, textX, textY)
    textY += 40
  }

  // English translation (always shown)
  if (quote.quoteEn) {
    textY += 10
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '400 22px Inter, sans-serif'
    const enLines = wrapText(ctx, quote.quoteEn, cardW - 120)
    for (const line of enLines) {
      ctx.fillText(line, textX, textY)
      textY += 34
    }
  }

  // 4. Brand area (bottom)
  // Slogan
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '400 14px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(SLOGAN, canvas.width / 2, canvas.height - 40)

  // Logo placeholder (text-based)
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 28px "Noto Sans SC", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('知语 Zhiyu', 60, canvas.height - 80)

  // QR placeholder (simple white square)
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, canvas.width - 160, canvas.height - 180, 100, 100, 8)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.font = '400 12px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('QR', canvas.width - 110, canvas.height - 125)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/png',
    )
  })
}

/**
 * Generate Article share card (1080×1350)
 */
export async function generateArticleShareImage(
  article: ArticleDetail,
  _locale: string = 'zh',
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1350
  const ctx = canvas.getContext('2d')!

  // 1. Cover image (top 60% = 648px)
  const coverH = 648
  if (article.coverUrl) {
    try {
      const coverImg = await loadImage(article.coverUrl)
      const scale = Math.max(canvas.width / coverImg.width, coverH / coverImg.height)
      const w = coverImg.width * scale
      const h = coverImg.height * scale
      ctx.drawImage(coverImg, (canvas.width - w) / 2, (coverH - h) / 2, w, h)
    } catch {
      // Fallback gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, coverH)
      grad.addColorStop(0, '#e11d48')
      grad.addColorStop(1, '#0284c7')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, canvas.width, coverH)
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, coverH)
    grad.addColorStop(0, '#e11d48')
    grad.addColorStop(1, '#0284c7')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, coverH)
  }

  // 2. Text area (bottom 40% = 702px) — dark background
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, coverH, canvas.width, canvas.height - coverH)

  const zhTranslation = article.translations?.zh
  const enTranslation = article.translations?.en

  // Chinese title
  let textY = coverH + 60
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 36px "Noto Sans SC", sans-serif'
  ctx.textAlign = 'left'
  const titleLines = wrapText(ctx, zhTranslation?.title || '', canvas.width - 96)
  for (const line of titleLines.slice(0, 2)) {
    ctx.fillText(line, 48, textY)
    textY += 48
  }

  // English title (always English)
  if (enTranslation?.title) {
    textY += 10
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '400 20px Inter, sans-serif'
    const enTitleLines = wrapText(ctx, enTranslation.title, canvas.width - 96)
    for (const line of enTitleLines.slice(0, 2)) {
      ctx.fillText(line, 48, textY)
      textY += 30
    }
  }

  // Summary
  if (zhTranslation?.summary) {
    textY += 20
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '400 18px "Noto Sans SC", sans-serif'
    const summaryLines = wrapText(ctx, zhTranslation.summary, canvas.width - 96)
    for (const line of summaryLines.slice(0, 3)) {
      ctx.fillText(line, 48, textY)
      textY += 28
    }
  }

  // Brand area
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.font = '400 12px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(SLOGAN, canvas.width / 2, canvas.height - 16)

  // Logo
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 22px "Noto Sans SC", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('知语 Zhiyu', 48, canvas.height - 40)

  // QR placeholder
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, canvas.width - 128, canvas.height - 120, 80, 80, 8)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.font = '400 10px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('QR', canvas.width - 88, canvas.height - 75)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      'image/png',
    )
  })
}

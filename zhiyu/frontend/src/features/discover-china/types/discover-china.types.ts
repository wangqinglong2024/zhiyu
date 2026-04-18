// 发现中国模块类型定义

export interface Category {
  id: number
  slug: string
  name: string
  description: string | null
  coverUrl: string | null
  iconUrl: string | null
  articleCount: number
  isPublic: boolean
  sortOrder: number
}

export interface ArticleListItem {
  id: string
  slug: string
  title: string
  summary: string | null
  thumbnailUrl: string | null
  viewCount: number
  favoriteCount: number
  isFavorited: boolean
  publishedAt: string | null
}

export interface ArticleTranslation {
  title: string
  summary: string | null
  content: string
  vocabulary: VocabularyItem[] | null
  quiz: QuizItem[] | null
}

export interface VocabularyItem {
  word: string
  pinyin: string
  translation: string
  audioUrl?: string
}

export interface QuizItem {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface ArticleDetail {
  id: string
  categoryId: number
  slug: string
  coverUrl: string | null
  audioUrl: string | null
  audioDuration: number | null
  viewCount: number
  favoriteCount: number
  isFavorited: boolean
  publishedAt: string | null
  translations: Record<string, ArticleTranslation>
}

export interface DailyQuote {
  id: string
  quoteZh: string
  quotePinyin: string
  sourceZh: string | null
  interpretationZh: string | null
  quoteEn: string | null
  interpretationEn: string | null
  quoteVi: string | null
  interpretationVi: string | null
  scheduledDate: string
  isHoliday: boolean
  holidayName: string | null
  holidayType: number
  bgImageUrl: string | null
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}

export interface FavoriteItem {
  id: string
  articleId: string
  article: {
    title: string
    summary: string | null
    thumbnailUrl: string | null
    viewCount: number
    categoryId: number
    publishedAt: string | null
  }
  createdAt: string
}

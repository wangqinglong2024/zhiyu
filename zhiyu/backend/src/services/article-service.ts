import { articleRepo } from '../repositories/article-repo'
import { categoryRepo } from '../repositories/category-repo'
import { AppException } from '../core/exceptions'

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
  translations: Record<string, {
    title: string
    summary: string | null
    content: string
    vocabulary: unknown | null
    quiz: unknown | null
  }>
}

export class ArticleService {
  async getArticleList(
    categoryId: number,
    page: number,
    pageSize: number,
    sort: 'latest' | 'popular',
    locale: string,
    userId?: string,
  ): Promise<{ items: ArticleListItem[]; total: number }> {
    // 验证类目是否存在
    const category = await categoryRepo.findById(categoryId)
    if (!category) {
      throw new AppException(404, 40400, '类目不存在')
    }

    // 未登录用户访问非公开类目
    if (!category.is_public && !userId) {
      throw new AppException(403, 40301, 'CATEGORY_ACCESS_DENIED')
    }

    const { items, total } = await articleRepo.findByCategoryPaginated(categoryId, page, pageSize, sort)

    // 查询翻译
    const articleIds = items.map(a => a.id)
    const translations = await articleRepo.findTranslationsByLocale(articleIds, locale)
    const transMap = new Map(translations.map(t => [t.article_id, t]))

    // 查询收藏状态
    let favoriteSet = new Set<string>()
    if (userId && articleIds.length > 0) {
      const { favoriteRepo } = await import('../repositories/favorite-repo')
      const statuses = await favoriteRepo.checkFavorites(userId, articleIds)
      favoriteSet = new Set(Object.entries(statuses).filter(([, v]) => v).map(([k]) => k))
    }

    const resultItems: ArticleListItem[] = items.map(a => {
      const t = transMap.get(a.id)
      return {
        id: a.id,
        slug: a.slug,
        title: t?.title ?? a.slug,
        summary: t?.summary ?? null,
        thumbnailUrl: a.thumbnail_url,
        viewCount: a.view_count,
        favoriteCount: a.favorite_count,
        isFavorited: favoriteSet.has(a.id),
        publishedAt: a.published_at,
      }
    })

    return { items: resultItems, total }
  }

  async getArticleDetail(articleId: string, userId?: string): Promise<ArticleDetail> {
    const article = await articleRepo.findById(articleId)
    if (!article) {
      throw new AppException(404, 40400, '文章不存在')
    }

    // 验证类目访问权限
    const category = await categoryRepo.findById(article.category_id)
    if (!category?.is_public && !userId) {
      throw new AppException(403, 40301, 'CATEGORY_ACCESS_DENIED')
    }

    const rawTranslations = await articleRepo.findTranslations(articleId)

    const translations: ArticleDetail['translations'] = {}
    for (const t of rawTranslations) {
      translations[t.locale] = {
        title: t.title,
        summary: t.summary,
        content: t.content,
        vocabulary: t.vocabulary,
        quiz: t.quiz,
      }
    }

    // 收藏状态
    let isFavorited = false
    if (userId) {
      const { favoriteRepo } = await import('../repositories/favorite-repo')
      const statuses = await favoriteRepo.checkFavorites(userId, [articleId])
      isFavorited = statuses[articleId] ?? false
    }

    return {
      id: article.id,
      categoryId: article.category_id,
      slug: article.slug,
      coverUrl: article.cover_url,
      audioUrl: article.audio_url,
      audioDuration: article.audio_duration,
      viewCount: article.view_count,
      favoriteCount: article.favorite_count,
      isFavorited,
      publishedAt: article.published_at,
      translations,
    }
  }

  async recordView(articleId: string, userId?: string, fingerprint?: string): Promise<boolean> {
    // 验证文章存在
    const article = await articleRepo.findById(articleId)
    if (!article) {
      throw new AppException(404, 40400, '文章不存在')
    }

    const counted = await articleRepo.recordView(articleId, userId, fingerprint)
    if (counted) {
      await articleRepo.incrementViewCount(articleId)
    }
    return counted
  }
}

export const articleService = new ArticleService()

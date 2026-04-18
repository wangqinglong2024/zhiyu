import { favoriteRepo } from '../repositories/favorite-repo'
import { articleRepo } from '../repositories/article-repo'
import { AppException } from '../core/exceptions'

export interface FavoriteResponse {
  id: string
  articleId: string
  createdAt: string
}

export interface FavoriteListItem {
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

export class FavoriteService {
  async addFavorite(userId: string, articleId: string): Promise<{ data: FavoriteResponse; isNew: boolean }> {
    // 验证文章存在且已发布
    const article = await articleRepo.findById(articleId)
    if (!article) {
      throw new AppException(404, 40400, '文章不存在或未发布')
    }

    const { row, isNew } = await favoriteRepo.add(userId, articleId)
    return {
      data: {
        id: row.id,
        articleId: row.article_id,
        createdAt: row.created_at,
      },
      isNew,
    }
  }

  async removeFavorite(userId: string, articleId: string): Promise<void> {
    await favoriteRepo.remove(userId, articleId)
  }

  async getFavoriteList(
    userId: string,
    page: number,
    pageSize: number,
    locale: string,
  ): Promise<{ items: FavoriteListItem[]; total: number }> {
    const { items, total } = await favoriteRepo.findByUserPaginated(userId, page, pageSize)

    if (items.length === 0) return { items: [], total }

    // 批量获取文章信息
    const articleIds = items.map(f => f.article_id)
    const translations = await articleRepo.findTranslationsByLocale(articleIds, locale)
    const transMap = new Map(translations.map(t => [t.article_id, t]))

    // 获取文章基本信息
    const articleInfos: FavoriteListItem[] = []
    for (const fav of items) {
      const article = await articleRepo.findById(fav.article_id)
      if (!article) continue // 文章已下架，跳过

      const t = transMap.get(fav.article_id)
      articleInfos.push({
        id: fav.id,
        articleId: fav.article_id,
        article: {
          title: t?.title ?? article.slug,
          summary: t?.summary ?? null,
          thumbnailUrl: article.thumbnail_url,
          viewCount: article.view_count,
          categoryId: article.category_id,
          publishedAt: article.published_at,
        },
        createdAt: fav.created_at,
      })
    }

    return { items: articleInfos, total }
  }

  async checkFavorites(userId: string, articleIds: string[]): Promise<Record<string, boolean>> {
    return favoriteRepo.checkFavorites(userId, articleIds)
  }
}

export const favoriteService = new FavoriteService()

import { categoryRepo } from '../repositories/category-repo'

export interface CategoryListItem {
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

export class CategoryService {
  async getCategories(locale: string): Promise<CategoryListItem[]> {
    const categories = await categoryRepo.findAll()
    const categoryIds = categories.map(c => c.id)
    const translations = await categoryRepo.findTranslations(categoryIds, locale)

    const translationMap = new Map(translations.map(t => [t.category_id, t]))

    return categories.map(c => {
      const t = translationMap.get(c.id)
      return {
        id: c.id,
        slug: c.slug,
        name: t?.name ?? c.slug,
        description: t?.description ?? null,
        coverUrl: c.cover_url,
        iconUrl: c.icon_url,
        articleCount: c.article_count,
        isPublic: c.is_public,
        sortOrder: c.sort_order,
      }
    })
  }
}

export const categoryService = new CategoryService()

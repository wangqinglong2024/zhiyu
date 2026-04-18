import { supabaseAdmin } from '../core/supabase'

export interface CategoryRow {
  id: number
  slug: string
  sort_order: number
  is_public: boolean
  cover_url: string | null
  icon_url: string | null
  article_count: number
  status: string
}

export interface CategoryTranslationRow {
  category_id: number
  locale: string
  name: string
  description: string | null
}

export class CategoryRepository {
  async findAll(): Promise<CategoryRow[]> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })

    if (error) throw new Error(`查询类目失败: ${error.message}`)
    return (data ?? []) as CategoryRow[]
  }

  async findTranslations(categoryIds: number[], locale: string): Promise<CategoryTranslationRow[]> {
    const { data, error } = await supabaseAdmin
      .from('category_translations')
      .select('*')
      .in('category_id', categoryIds)
      .eq('locale', locale)

    if (error) throw new Error(`查询类目翻译失败: ${error.message}`)
    return (data ?? []) as CategoryTranslationRow[]
  }

  async findById(id: number): Promise<CategoryRow | null> {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw new Error(`查询类目失败: ${error.message}`)
    return data as CategoryRow | null
  }
}

export const categoryRepo = new CategoryRepository()

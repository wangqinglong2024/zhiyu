import { supabaseAdmin } from '../core/supabase'

export interface ArticleRow {
  id: string
  category_id: number
  slug: string
  cover_url: string | null
  thumbnail_url: string | null
  audio_url: string | null
  audio_duration: number | null
  view_count: number
  favorite_count: number
  sort_weight: number
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleTranslationRow {
  article_id: string
  locale: string
  title: string
  summary: string | null
  content: string
  vocabulary: unknown | null
  quiz: unknown | null
}

export class ArticleRepository {
  async findByCategoryPaginated(
    categoryId: number,
    page: number,
    pageSize: number,
    sort: 'latest' | 'popular',
  ): Promise<{ items: ArticleRow[]; total: number }> {
    // Count
    const { count, error: countErr } = await supabaseAdmin
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('status', 'published')

    if (countErr) throw new Error(`统计文章数量失败: ${countErr.message}`)

    // Query
    let query = supabaseAdmin
      .from('articles')
      .select('*')
      .eq('category_id', categoryId)
      .eq('status', 'published')

    if (sort === 'latest') {
      query = query.order('published_at', { ascending: false })
    } else {
      query = query
        .order('view_count', { ascending: false })
        .order('published_at', { ascending: false })
    }

    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1)

    const { data, error } = await query

    if (error) throw new Error(`查询文章列表失败: ${error.message}`)
    return { items: (data ?? []) as ArticleRow[], total: count ?? 0 }
  }

  async findById(articleId: string): Promise<ArticleRow | null> {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw new Error(`查询文章详情失败: ${error.message}`)
    return data as ArticleRow | null
  }

  async findTranslations(articleId: string): Promise<ArticleTranslationRow[]> {
    const { data, error } = await supabaseAdmin
      .from('article_translations')
      .select('*')
      .eq('article_id', articleId)

    if (error) throw new Error(`查询文章翻译失败: ${error.message}`)
    return (data ?? []) as ArticleTranslationRow[]
  }

  async findTranslationsByLocale(articleIds: string[], locale: string): Promise<ArticleTranslationRow[]> {
    if (articleIds.length === 0) return []
    const { data, error } = await supabaseAdmin
      .from('article_translations')
      .select('article_id, locale, title, summary')
      .in('article_id', articleIds)
      .eq('locale', locale)

    if (error) throw new Error(`查询文章翻译失败: ${error.message}`)
    return (data ?? []) as ArticleTranslationRow[]
  }

  async recordView(articleId: string, userId?: string, fingerprint?: string): Promise<boolean> {
    if (userId) {
      // 登录用户去重
      const { error } = await supabaseAdmin
        .from('article_views')
        .insert({ article_id: articleId, user_id: userId })

      if (error) {
        // 唯一索引冲突 = 已浏览
        if (error.code === '23505') return false
        throw new Error(`记录浏览失败: ${error.message}`)
      }
    } else if (fingerprint) {
      // 未登录用户 24 小时去重
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: existing } = await supabaseAdmin
        .from('article_views')
        .select('id')
        .eq('article_id', articleId)
        .eq('fingerprint', fingerprint)
        .gte('viewed_at', cutoff)
        .limit(1)

      if (existing && existing.length > 0) return false

      const { error } = await supabaseAdmin
        .from('article_views')
        .insert({ article_id: articleId, fingerprint })

      if (error) throw new Error(`记录浏览失败: ${error.message}`)
    } else {
      return false
    }

    // 使用 incrementViewCount 更新计数
    await this.incrementViewCount(articleId)

    return true
  }

  async incrementViewCount(articleId: string): Promise<void> {
    // 简单原子 +1 — 使用 SQL 函数或直接查询更新
    const { data } = await supabaseAdmin
      .from('articles')
      .select('view_count')
      .eq('id', articleId)
      .single()

    if (data) {
      await supabaseAdmin
        .from('articles')
        .update({ view_count: data.view_count + 1 })
        .eq('id', articleId)
    }
  }
}

export const articleRepo = new ArticleRepository()

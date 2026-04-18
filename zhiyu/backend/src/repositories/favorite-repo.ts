import { supabaseAdmin } from '../core/supabase'

export interface FavoriteRow {
  id: string
  user_id: string
  article_id: string
  created_at: string
}

export class FavoriteRepository {
  async add(userId: string, articleId: string): Promise<{ row: FavoriteRow; isNew: boolean }> {
    // 先查询是否已存在
    const { data: existing } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .maybeSingle()

    if (existing) {
      return { row: existing as FavoriteRow, isNew: false }
    }

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .insert({ user_id: userId, article_id: articleId })
      .select('*')
      .single()

    if (error) {
      // 并发场景：唯一约束冲突
      if (error.code === '23505') {
        const { data: retryData } = await supabaseAdmin
          .from('user_favorites')
          .select('*')
          .eq('user_id', userId)
          .eq('article_id', articleId)
          .single()
        return { row: retryData as FavoriteRow, isNew: false }
      }
      throw new Error(`收藏失败: ${error.message}`)
    }

    return { row: data as FavoriteRow, isNew: true }
  }

  async remove(userId: string, articleId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('article_id', articleId)
      .select('id')

    if (error) throw new Error(`取消收藏失败: ${error.message}`)
    return (data?.length ?? 0) > 0
  }

  async findByUserPaginated(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: FavoriteRow[]; total: number }> {
    const { count, error: countErr } = await supabaseAdmin
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countErr) throw new Error(`统计收藏数量失败: ${countErr.message}`)

    const offset = (page - 1) * pageSize
    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw new Error(`查询收藏列表失败: ${error.message}`)
    return { items: (data ?? []) as FavoriteRow[], total: count ?? 0 }
  }

  async checkFavorites(userId: string, articleIds: string[]): Promise<Record<string, boolean>> {
    if (articleIds.length === 0) return {}

    const { data, error } = await supabaseAdmin
      .from('user_favorites')
      .select('article_id')
      .eq('user_id', userId)
      .in('article_id', articleIds)

    if (error) throw new Error(`查询收藏状态失败: ${error.message}`)

    const favSet = new Set((data ?? []).map((r: { article_id: string }) => r.article_id))
    const result: Record<string, boolean> = {}
    for (const id of articleIds) {
      result[id] = favSet.has(id)
    }
    return result
  }
}

export const favoriteRepo = new FavoriteRepository()

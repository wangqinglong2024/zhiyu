import { supabaseAdmin } from '../core/supabase'

/**
 * i18n 数据访问层
 */
export class I18nRepo {
  /**
   * 获取指定语言全部翻译（按 namespace 分组）
   */
  async findByLang(lang: string): Promise<Record<string, Record<string, string>>> {
    const { data, error } = await supabaseAdmin
      .from('i18n_translations')
      .select('namespace, translation_key, translation_value')
      .eq('language', lang)

    if (error) throw new Error(`查询翻译失败: ${error.message}`)

    const result: Record<string, Record<string, string>> = {}
    for (const row of data || []) {
      if (!result[row.namespace]) result[row.namespace] = {}
      result[row.namespace][row.translation_key] = row.translation_value
    }
    return result
  }

  /**
   * 获取指定语言 + namespace 翻译
   */
  async findByLangAndNamespace(lang: string, namespace: string): Promise<Record<string, string>> {
    const { data, error } = await supabaseAdmin
      .from('i18n_translations')
      .select('translation_key, translation_value')
      .eq('language', lang)
      .eq('namespace', namespace)

    if (error) throw new Error(`查询翻译失败: ${error.message}`)

    const result: Record<string, string> = {}
    for (const row of data || []) {
      result[row.translation_key] = row.translation_value
    }
    return result
  }

  /**
   * 管理后台 — 翻译列表（分页+搜索+筛选）
   */
  async findAll(params: {
    page: number
    pageSize: number
    keyword?: string
    namespace?: string
    language?: string
  }) {
    let query = supabaseAdmin
      .from('i18n_translations')
      .select('*', { count: 'exact' })

    if (params.namespace) {
      query = query.eq('namespace', params.namespace)
    }
    if (params.language) {
      query = query.eq('language', params.language)
    }
    if (params.keyword) {
      query = query.or(`translation_key.ilike.%${params.keyword}%,translation_value.ilike.%${params.keyword}%`)
    }

    const offset = (params.page - 1) * params.pageSize
    query = query.order('namespace').order('translation_key')
      .range(offset, offset + params.pageSize - 1)

    const { data, count, error } = await query
    if (error) throw new Error(`查询翻译列表失败: ${error.message}`)

    return { items: data || [], total: count || 0 }
  }

  /**
   * 新增翻译
   */
  async create(input: {
    translation_key: string
    language: string
    translation_value: string
    namespace: string
  }) {
    const { data, error } = await supabaseAdmin
      .from('i18n_translations')
      .insert(input)
      .select()
      .single()

    if (error) {
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        throw new Error('DUPLICATE')
      }
      throw new Error(`新增翻译失败: ${error.message}`)
    }
    return data
  }

  /**
   * 更新翻译
   */
  async update(id: string, input: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('i18n_translations')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`更新翻译失败: ${error.message}`)
    return data
  }

  /**
   * 删除翻译
   */
  async delete(id: string) {
    const { error } = await supabaseAdmin
      .from('i18n_translations')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`删除翻译失败: ${error.message}`)
  }

  /**
   * 批量 upsert
   */
  async batchUpsert(items: Array<{
    translation_key: string
    language: string
    translation_value: string
    namespace: string
  }>) {
    const { data, error } = await supabaseAdmin
      .from('i18n_translations')
      .upsert(items, {
        onConflict: 'namespace,translation_key,language',
      })
      .select()

    if (error) throw new Error(`批量导入失败: ${error.message}`)
    return data
  }
}

export const i18nRepo = new I18nRepo()

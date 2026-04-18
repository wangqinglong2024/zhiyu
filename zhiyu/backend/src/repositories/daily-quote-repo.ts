import { supabaseAdmin } from '../core/supabase'

export interface DailyQuoteRow {
  id: string
  quote_zh: string
  quote_pinyin: string
  source_zh: string | null
  interpretation_zh: string | null
  quote_en: string | null
  interpretation_en: string | null
  quote_vi: string | null
  interpretation_vi: string | null
  scheduled_date: string
  is_holiday: boolean
  holiday_name: string | null
  holiday_type: number
  bg_image_url: string | null
  status: string
  published_at: string | null
}

export class DailyQuoteRepository {
  async findTodayQuote(): Promise<DailyQuoteRow | null> {
    const today = new Date().toISOString().split('T')[0]

    // 优先级查询：当日节日金句 > 当日常规金句 > 最近已发布金句
    const { data, error } = await supabaseAdmin
      .from('daily_quotes')
      .select('*')
      .eq('status', 'published')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: false })
      .limit(10)

    if (error) throw new Error(`查询当日金句失败: ${error.message}`)
    if (!data || data.length === 0) return null

    // 查找当日金句
    const todayQuotes = data.filter((q: DailyQuoteRow) => q.scheduled_date === today)

    if (todayQuotes.length > 0) {
      // 当日有金句，按优先级排序（节日优先）
      const holiday = todayQuotes.find((q: DailyQuoteRow) => q.is_holiday)
      if (holiday) return holiday as DailyQuoteRow

      return todayQuotes[0] as DailyQuoteRow
    }

    // 降级：最近一天的已发布金句
    return data[0] as DailyQuoteRow
  }

  async findPaginated(page: number, pageSize: number): Promise<{ items: DailyQuoteRow[]; total: number }> {
    const today = new Date().toISOString().split('T')[0]

    const { count, error: countErr } = await supabaseAdmin
      .from('daily_quotes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .lte('scheduled_date', today)

    if (countErr) throw new Error(`统计金句数量失败: ${countErr.message}`)

    const offset = (page - 1) * pageSize
    const { data, error } = await supabaseAdmin
      .from('daily_quotes')
      .select('*')
      .eq('status', 'published')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw new Error(`查询金句列表失败: ${error.message}`)
    return { items: (data ?? []) as DailyQuoteRow[], total: count ?? 0 }
  }
}

export const dailyQuoteRepo = new DailyQuoteRepository()

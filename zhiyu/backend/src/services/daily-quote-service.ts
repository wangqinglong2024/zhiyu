import { dailyQuoteRepo, type DailyQuoteRow } from '../repositories/daily-quote-repo'

export interface DailyQuoteResponse {
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

function mapQuote(row: DailyQuoteRow): DailyQuoteResponse {
  return {
    id: row.id,
    quoteZh: row.quote_zh,
    quotePinyin: row.quote_pinyin,
    sourceZh: row.source_zh,
    interpretationZh: row.interpretation_zh,
    quoteEn: row.quote_en,
    interpretationEn: row.interpretation_en,
    quoteVi: row.quote_vi,
    interpretationVi: row.interpretation_vi,
    scheduledDate: row.scheduled_date,
    isHoliday: row.is_holiday,
    holidayName: row.holiday_name,
    holidayType: row.holiday_type,
    bgImageUrl: row.bg_image_url,
  }
}

export class DailyQuoteService {
  async getTodayQuote(): Promise<DailyQuoteResponse | null> {
    const row = await dailyQuoteRepo.findTodayQuote()
    return row ? mapQuote(row) : null
  }

  async getQuoteList(page: number, pageSize: number): Promise<{ items: DailyQuoteResponse[]; total: number }> {
    const { items, total } = await dailyQuoteRepo.findPaginated(page, pageSize)
    return {
      items: items.map(mapQuote),
      total,
    }
  }
}

export const dailyQuoteService = new DailyQuoteService()

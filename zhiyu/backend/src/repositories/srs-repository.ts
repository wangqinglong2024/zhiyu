import { supabaseAdmin } from '../core/supabase'
import type { SrsReviewItemRow } from '../models/srs'

export async function findDueItems(userId: string, limit: number, module?: string): Promise<SrsReviewItemRow[]> {
  let query = supabaseAdmin
    .from('srs_review_items')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true })
    .limit(limit)

  if (module) {
    query = query.eq('source_type', module)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as SrsReviewItemRow[]
}

export async function countTotalDue(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('srs_review_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')
    .lte('next_review_at', new Date().toISOString())

  if (error) throw error
  return count ?? 0
}

export async function countTodayReviewed(userId: string): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count, error } = await supabaseAdmin
    .from('srs_review_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('reviewed_at', todayStart.toISOString())

  if (error) throw error
  return count ?? 0
}

export async function findReviewItemById(itemId: string): Promise<SrsReviewItemRow | null> {
  const { data, error } = await supabaseAdmin
    .from('srs_review_items')
    .select('*')
    .eq('id', itemId)
    .maybeSingle()

  if (error) throw error
  return data as SrsReviewItemRow | null
}

export async function updateReviewItem(itemId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('srs_review_items')
    .update(updates)
    .eq('id', itemId)

  if (error) throw error
}

export async function createReviewLog(log: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('srs_review_logs')
    .insert(log)

  if (error) throw error
}

export async function createReviewItem(item: Record<string, unknown>): Promise<SrsReviewItemRow> {
  const { data, error } = await supabaseAdmin
    .from('srs_review_items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data as SrsReviewItemRow
}

export async function findActiveItemBySource(
  userId: string,
  sourceType: string,
  sourceId: string,
): Promise<SrsReviewItemRow | null> {
  const { data, error } = await supabaseAdmin
    .from('srs_review_items')
    .select('*')
    .eq('user_id', userId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return data as SrsReviewItemRow | null
}

export async function countItemsByStatus(userId: string) {
  const statuses = ['active', 'graduated', 'suspended'] as const
  const result: Record<string, number> = {}

  for (const s of statuses) {
    const { count, error } = await supabaseAdmin
      .from('srs_review_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', s)

    if (error) throw error
    result[s] = count ?? 0
  }

  return result
}

export async function findSrsConfig(): Promise<Record<string, unknown>> {
  const { data, error } = await supabaseAdmin
    .from('srs_config')
    .select('config_key, config_value')

  if (error) throw error

  const configMap: Record<string, unknown> = {}
  for (const row of data ?? []) {
    configMap[row.config_key] = row.config_value
  }
  return configMap
}

export async function countTodayCorrect(userId: string): Promise<number> {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count, error } = await supabaseAdmin
    .from('srs_review_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('result', 'remembered')
    .gte('reviewed_at', todayStart.toISOString())

  if (error) throw error
  return count ?? 0
}

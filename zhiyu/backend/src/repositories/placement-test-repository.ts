import { supabaseAdmin } from '../core/supabase'
import type { PlacementTestRow, PlacementQuestionRow } from '../models/placement-test'

export async function createTest(userId: string): Promise<PlacementTestRow> {
  const { data, error } = await supabaseAdmin
    .from('placement_tests')
    .insert({ user_id: userId })
    .select()
    .single()

  if (error) throw error
  return data as PlacementTestRow
}

export async function findTestById(testId: string): Promise<PlacementTestRow | null> {
  const { data, error } = await supabaseAdmin
    .from('placement_tests')
    .select('*')
    .eq('id', testId)
    .maybeSingle()

  if (error) throw error
  return data as PlacementTestRow | null
}

export async function updateTest(testId: string, updates: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('placement_tests')
    .update(updates)
    .eq('id', testId)

  if (error) throw error
}

export async function findLatestCompletedTest(userId: string): Promise<PlacementTestRow | null> {
  const { data, error } = await supabaseAdmin
    .from('placement_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as PlacementTestRow | null
}

export async function findQuestionsByDifficulty(
  difficulty: number,
  excludeIds: string[],
  limit: number = 1,
): Promise<PlacementQuestionRow[]> {
  let query = supabaseAdmin
    .from('placement_test_questions')
    .select('*')
    .eq('difficulty_level', difficulty)
    .eq('is_active', true)
    .limit(limit)

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PlacementQuestionRow[]
}

export async function findUserInProgressTest(userId: string): Promise<PlacementTestRow | null> {
  const { data, error } = await supabaseAdmin
    .from('placement_tests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as PlacementTestRow | null
}

import { supabaseAdmin } from '../core/supabase'
import type { PurchaseRow } from '../models/course-purchase'

export async function findPurchaseByIdempotencyKey(key: string): Promise<PurchaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('*')
    .eq('idempotency_key', key)
    .maybeSingle()

  if (error) throw error
  return data as PurchaseRow | null
}

export async function findActivePurchase(userId: string, levelId: string): Promise<PurchaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('level_id', levelId)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error) throw error
  return data as PurchaseRow | null
}

export async function createPurchase(purchase: Record<string, unknown>): Promise<PurchaseRow> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .insert(purchase)
    .select()
    .single()

  if (error) throw error
  return data as PurchaseRow
}

export async function updatePurchaseStatus(
  purchaseId: string,
  status: string,
  extraFields: Record<string, unknown> = {},
) {
  const { error } = await supabaseAdmin
    .from('user_course_purchases')
    .update({ status, ...extraFields })
    .eq('id', purchaseId)

  if (error) throw error
}

export async function updatePurchaseByPaddleTxId(
  txId: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin
    .from('user_course_purchases')
    .update(updates)
    .eq('paddle_transaction_id', txId)

  if (error) throw error
}

export async function findUserPurchases(userId: string): Promise<PurchaseRow[]> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as PurchaseRow[]
}

export async function findUserActivePurchases(userId: string): Promise<PurchaseRow[]> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('expires_at', new Date().toISOString())

  if (error) throw error
  return (data ?? []) as PurchaseRow[]
}

export async function findPurchaseByPaddleTxId(txId: string): Promise<PurchaseRow | null> {
  const { data, error } = await supabaseAdmin
    .from('user_course_purchases')
    .select('*')
    .eq('paddle_transaction_id', txId)
    .maybeSingle()

  if (error) throw error
  return data as PurchaseRow | null
}

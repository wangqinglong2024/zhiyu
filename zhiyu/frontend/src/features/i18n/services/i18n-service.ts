import type { UILanguage } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export async function fetchTranslations(lang: UILanguage): Promise<Record<string, Record<string, string>>> {
  const res = await fetch(`${API_BASE}/v1/i18n/${lang}`)
  if (!res.ok) throw new Error(`Failed to fetch translations: ${res.status}`)
  const json = await res.json()
  return json.data || {}
}

export async function fetchNamespaceTranslations(lang: UILanguage, namespace: string): Promise<Record<string, string>> {
  const res = await fetch(`${API_BASE}/v1/i18n/${lang}/${namespace}`)
  if (!res.ok) throw new Error(`Failed to fetch namespace translations: ${res.status}`)
  const json = await res.json()
  return json.data || {}
}

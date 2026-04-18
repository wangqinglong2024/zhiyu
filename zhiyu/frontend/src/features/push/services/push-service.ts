import type { PushSubscriptionPayload, NotificationPreferences } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

function getHeaders(): HeadersInit {
  const token = sessionStorage.getItem('access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const pushService = {
  async getVapidPublicKey(): Promise<string> {
    const res = await fetch(`${API_BASE}/api/v1/push/vapid-public-key`)
    const json = await res.json()
    return json.data.publicKey
  },

  async subscribe(payload: PushSubscriptionPayload): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/push/subscribe`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to subscribe')
  },

  async unsubscribe(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/push/unsubscribe`, {
      method: 'POST',
      headers: getHeaders(),
    })
    if (!res.ok) throw new Error('Failed to unsubscribe')
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const res = await fetch(`${API_BASE}/api/v1/push/preferences`, {
      headers: getHeaders(),
    })
    const json = await res.json()
    return json.data
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<void> {
    const res = await fetch(`${API_BASE}/api/v1/push/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(prefs),
    })
    if (!res.ok) throw new Error('Failed to update preferences')
  },
}

/**
 * 系统设置全局状态（公告、价格等）
 */
import { create } from 'zustand'

interface SettingsState {
  announcement: string | null
  orderPrice: number
  setSettings: (s: Partial<SettingsState>) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  announcement: null,
  orderPrice: 28.8,
  setSettings: (s) => set(s),
}))

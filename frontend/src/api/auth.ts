import client from './client'
import type { ApiResponse, LoginResponse } from '../types/api'

export const sendSms = (phone: string) =>
  client.post<ApiResponse>('/auth/send-sms', { phone })

export const login = (phone: string, code: string, invite_code?: string) =>
  client.post<ApiResponse<LoginResponse>>('/auth/login', { phone, code, invite_code })

export const wechatLogin = (code: string, invite_code?: string) =>
  client.post<ApiResponse<LoginResponse>>('/auth/wechat', { code, invite_code })

export interface MeResponse {
  user_id: string
  phone_masked: string
  invite_code: string
  created_at: string
}

export const getMe = () =>
  client.get<ApiResponse<MeResponse>>('/auth/me')

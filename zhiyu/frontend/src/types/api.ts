// API 类型占位
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

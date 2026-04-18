// Supabase 类型占位 — 后续 supabase gen types 覆盖
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

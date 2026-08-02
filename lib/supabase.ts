import dns from 'node:dns'
import { createClient } from '@supabase/supabase-js'

dns.setDefaultResultOrder('ipv4first')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません。.env.local を確認してください。'
  )
}

// 個人利用・単一ユーザー前提のためサーバー/クライアント共通の単一クライアントとする。
// 複数ユーザー対応(認証連携)が必要になった場合は @supabase/ssr の導入を検討する。
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

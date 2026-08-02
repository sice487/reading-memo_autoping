// ブラウザ(クライアントサイド)専用のSupabaseクライアント
// Server Actionを使わずブラウザから直接Supabaseにアクセスするため、
// DNS設定不要でWindows環境のfetch failedを回避できます
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * 서비스 역할 클라이언트 — RLS 우회.
 * 서버 전용 (API Route, Server Action 등)에서만 사용.
 * 비로그인 사용자의 폼 제출 등 auth.uid() 없는 상황에서 사용.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

import { createAdminClient } from '@/lib/supabase/admin'

export function generateApiKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `crm_${hex}`
}

export async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(key)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function validateApiKey(
  key: string
): Promise<string | null> {
  const hash = await hashApiKey(key)
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('workspace_api_keys')
    .select('workspace_id')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single()

  if (!data) return null

  // last_used_at 업데이트
  await supabase
    .from('workspace_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash)

  return data.workspace_id
}

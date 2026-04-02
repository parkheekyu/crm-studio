import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey, hashApiKey } from '@/lib/api-keys'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { workspaceId, name } = await request.json()

  // 워크스페이스 멤버 확인
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rawKey = generateApiKey()
  const keyHash = await hashApiKey(rawKey)
  const keyPrefix = rawKey.slice(0, 12)

  const { data: record, error } = await supabase
    .from('workspace_api_keys')
    .insert({
      workspace_id: workspaceId,
      name: name || 'Default',
      key_hash: keyHash,
      key_prefix: keyPrefix,
    })
    .select('id, name, key_prefix, is_active, created_at, last_used_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ key: rawKey, record })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await request.json()

  const { error } = await supabase
    .from('workspace_api_keys')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const workspaceId = formData.get('workspaceId') as string | null

  if (!file || !workspaceId) {
    return NextResponse.json(
      { error: 'file and workspaceId are required' },
      { status: 400 }
    )
  }

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

  // 파일 확장자 추출
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  if (!allowedExts.includes(ext)) {
    return NextResponse.json(
      { error: 'Only jpg, png, webp, gif allowed' },
      { status: 400 }
    )
  }

  const uuid = crypto.randomUUID()
  const path = `${workspaceId}/${uuid}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('landing-images')
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json(
      { error: uploadError.message },
      { status: 500 }
    )
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('landing-images').getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}

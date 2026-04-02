'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2 } from 'lucide-react'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-가-힣]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function WorkspaceCreateForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugEdited) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    setSlug(slugify(value) || value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: insertError } = await supabase
      .from('workspaces')
      .insert({ name: name.trim(), slug: slug.trim(), owner_id: user.id })

    if (insertError) {
      if (insertError.code === '23505') {
        setError('이미 사용 중인 슬러그입니다. 다른 이름을 사용해 주세요.')
      } else {
        setError('워크스페이스 생성에 실패했습니다. 다시 시도해 주세요.')
      }
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-[14px] font-semibold text-gray-700">
          워크스페이스 이름
        </Label>
        <Input
          id="name"
          placeholder="예: 마케팅팀, 우리 회사"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="h-11 rounded-lg border-gray-200 text-[15px] focus-visible:ring-primary"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug" className="text-[14px] font-semibold text-gray-700">
          슬러그 (URL 식별자)
        </Label>
        <div className="relative">
          <Input
            id="slug"
            placeholder="my-workspace"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="h-11 rounded-lg border-gray-200 text-[15px] focus-visible:ring-primary"
            required
          />
        </div>
        <p className="text-[12px] text-muted-foreground">
          영문 소문자, 숫자, 하이픈만 사용 가능합니다.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
          <p className="text-[14px] text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!name.trim() || !slug.trim() || loading}
        className="w-full h-11 rounded-lg font-semibold text-[15px] bg-primary hover:bg-primary/90"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          '워크스페이스 만들기'
        )}
      </Button>
    </form>
  )
}

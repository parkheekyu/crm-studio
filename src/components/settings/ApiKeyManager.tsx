'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Copy, Check, Trash2, Key } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at: string | null
}

interface ApiKeyManagerProps {
  workspaceId: string
  initialKeys: ApiKey[]
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function ApiKeyManager({
  workspaceId,
  initialKeys,
}: ApiKeyManagerProps) {
  const router = useRouter()
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys)
  const [showCreate, setShowCreate] = useState(false)
  const [keyName, setKeyName] = useState('Default')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCreate = async () => {
    if (!keyName.trim()) return
    setCreating(true)

    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, name: keyName.trim() }),
    })

    if (res.ok) {
      const data = await res.json()
      setNewKey(data.key)
      setKeys((prev) => [data.record, ...prev])
      setShowCreate(false)
      setKeyName('Default')
    }

    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/settings/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id))
    }
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">API 키 관리</h2>
          <p className="text-[13px] text-gray-500 mt-1">
            외부 서비스에서 리드를 등록할 때 사용합니다.
          </p>
        </div>
      </div>

      {/* 새 키 표시 (1회만) */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
          <p className="text-[13px] font-semibold text-green-800">
            API 키가 생성되었습니다. 이 키는 다시 표시되지 않으니 반드시 복사해 두세요.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg text-[12px] text-gray-800 font-mono border border-green-200 break-all">
              {newKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => handleCopy(newKey)}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="text-[12px] text-green-700"
            onClick={() => setNewKey(null)}
          >
            확인 완료
          </Button>
        </div>
      )}

      {/* API 사용법 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
        <h3 className="text-[14px] font-semibold text-gray-900">사용 방법</h3>
        <div className="bg-gray-50 rounded-xl p-4">
          <code className="text-[12px] text-gray-700 font-mono whitespace-pre">{`POST /api/v1/leads
Authorization: Bearer crm_your_api_key
Content-Type: application/json

{
  "name": "홍길동",
  "phone": "010-1234-5678",
  "email": "test@example.com",
  "source": "Facebook Lead Ads"
}`}</code>
        </div>
      </div>

      {/* 키 목록 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-gray-900">API 키 목록</h3>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 rounded-lg text-[12px] font-semibold bg-primary hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            키 생성
          </Button>
        </div>

        {/* 생성 폼 */}
        {showCreate && (
          <div className="flex items-end gap-2 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 space-y-1">
              <Label className="text-[12px] font-semibold text-gray-600">
                키 이름
              </Label>
              <Input
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="예: Facebook Lead Ads"
                className="h-9 rounded-lg text-[13px]"
                autoFocus
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !keyName.trim()}
              className="h-9 rounded-lg text-[12px] bg-primary hover:bg-primary/90"
            >
              {creating ? '생성 중...' : '생성'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              className="h-9 rounded-lg text-[12px]"
            >
              취소
            </Button>
          </div>
        )}

        {/* 키 리스트 */}
        {keys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-[13px] text-gray-400">
              아직 생성된 API 키가 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center gap-3 py-3 px-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-700">
                    {key.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-[11px] text-gray-400 font-mono">
                      {key.key_prefix}...
                    </code>
                    <span className="text-[11px] text-gray-400">
                      생성: {formatDate(key.created_at)}
                    </span>
                    {key.last_used_at && (
                      <span className="text-[11px] text-gray-400">
                        마지막 사용: {formatDate(key.last_used_at)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(key.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

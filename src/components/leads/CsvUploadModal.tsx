'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// 한국어/영어 헤더 매핑
const COLUMN_MAP: Record<string, string> = {
  이름: 'name', name: 'name', 성명: 'name',
  전화번호: 'phone', phone: 'phone', 연락처: 'phone', 휴대폰: 'phone',
  이메일: 'email', email: 'email',
  유입경로: 'source', source: 'source', '유입 경로': 'source',
}

interface RowError {
  row: number
  message: string
}

interface ParsedLead {
  name: string
  phone: string
  email: string | null
  source: string | null
}

import type { LeadGroup } from '@/types'

interface CsvUploadModalProps {
  workspaceId: string
  groups?: LeadGroup[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Step = 'select' | 'preview' | 'uploading' | 'done'

export default function CsvUploadModal({
  workspaceId,
  groups = [],
  open,
  onOpenChange,
  onSuccess,
}: CsvUploadModalProps) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('select')
  const [fileName, setFileName] = useState('')
  const [validRows, setValidRows] = useState<ParsedLead[]>([])
  const [errors, setErrors] = useState<RowError[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set())

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const reset = () => {
    setStep('select')
    setFileName('')
    setValidRows([])
    setErrors([])
    setUploadError(null)
    setSelectedGroupIds(new Set())
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFile = (file: File) => {
    setFileName(file.name)
    setUploadError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const valid: ParsedLead[] = []
        const errs: RowError[] = []

        results.data.forEach((raw: any, idx: number) => {
          const rowNum = idx + 2 // 헤더 = 1행, 데이터 = 2행부터

          // 컬럼 매핑
          const mapped: Record<string, string> = {}
          for (const [key, val] of Object.entries(raw)) {
            const normalized = key.trim()
            const target = COLUMN_MAP[normalized] ?? COLUMN_MAP[normalized.toLowerCase()]
            if (target) mapped[target] = String(val ?? '').trim()
          }

          const name = mapped.name
          const phone = mapped.phone

          if (!name) {
            errs.push({ row: rowNum, message: '이름이 비어있습니다' })
            return
          }
          if (!phone) {
            errs.push({ row: rowNum, message: '전화번호가 비어있습니다' })
            return
          }

          valid.push({
            name,
            phone,
            email: mapped.email || null,
            source: mapped.source || null,
          })
        })

        setValidRows(valid)
        setErrors(errs)
        setStep('preview')
      },
      error() {
        setUploadError('CSV 파일을 읽을 수 없습니다. UTF-8 인코딩인지 확인해 주세요.')
      },
    })
  }

  const handleUpload = async () => {
    if (validRows.length === 0) return
    setStep('uploading')
    setUploadError(null)

    const supabase = createClient()
    const BATCH_SIZE = 500
    const insertedIds: string[] = []

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE).map((r) => ({
        workspace_id: workspaceId,
        name: r.name,
        phone: r.phone,
        email: r.email,
        source: r.source ?? 'CSV 업로드',
      }))

      const { data: inserted, error } = await supabase.from('leads').insert(batch).select('id')
      if (error) {
        setUploadError('업로드 중 오류가 발생했습니다. 다시 시도해 주세요.')
        setStep('preview')
        return
      }
      if (inserted) insertedIds.push(...inserted.map((l) => l.id))
    }

    // 그룹 멤버십 추가 + 그룹 시나리오 등록
    if (insertedIds.length > 0 && selectedGroupIds.size > 0) {
      const memberships = insertedIds.flatMap((lid) =>
        Array.from(selectedGroupIds).map((gid) => ({ group_id: gid, lead_id: lid }))
      )
      // 배치 삽입 (500건씩)
      for (let i = 0; i < memberships.length; i += 500) {
        await supabase.from('lead_group_memberships').insert(memberships.slice(i, i + 500))
      }
      for (const gid of selectedGroupIds) {
        fetch('/api/leads/enroll-group', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_ids: insertedIds, workspace_id: workspaceId, group_id: gid }),
        }).catch(() => {})
      }
    }

    // 시나리오 자동 등록 (소스 기반)
    if (insertedIds.length > 0) {
      fetch('/api/leads/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: insertedIds, workspace_id: workspaceId }),
      }).catch(() => {})
    }

    setStep('done')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-bold text-gray-900">
            CSV 업로드
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: 파일 선택 */}
        {step === 'select' && (
          <div className="space-y-4 mt-2">
            <p className="text-[14px] text-gray-500">
              CSV 파일을 선택해 리드를 일괄 등록할 수 있습니다.
              <br />
              필수 컬럼: <span className="font-semibold text-gray-700">이름, 전화번호</span>
              {' '}(선택: 이메일, 유입경로)
            </p>

            <label className="flex flex-col items-center justify-center gap-3 py-10 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary/50 hover:bg-blue-50/30 transition-colors">
              <Upload className="w-8 h-8 text-gray-300" />
              <span className="text-[14px] text-gray-400">
                클릭하여 CSV 파일 선택
              </span>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </label>

            {uploadError && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-[14px] text-red-600">{uploadError}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: 미리보기 */}
        {step === 'preview' && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 text-[14px] text-gray-600">
              <FileText className="w-4 h-4" />
              {fileName}
            </div>

            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-center">
                <p className="text-lg font-bold text-blue-600">{validRows.length}</p>
                <p className="text-[12px] text-blue-500">등록 가능</p>
              </div>
              {errors.length > 0 && (
                <div className="flex-1 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-center">
                  <p className="text-lg font-bold text-red-500">{errors.length}</p>
                  <p className="text-[12px] text-red-400">오류</p>
                </div>
              )}
            </div>

            {errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1">
                {errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[13px] text-red-500">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{err.row}행: {err.message}</span>
                  </div>
                ))}
              </div>
            )}

            {groups.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[13px] font-semibold text-gray-700">그룹에 추가 (선택)</p>
                <div className="flex flex-wrap gap-1.5">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGroup(g.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[13px] font-medium border transition-colors ${
                        selectedGroupIds.has(g.id)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: g.color || '#9ca3af' }}
                      />
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {uploadError && (
              <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                <p className="text-[14px] text-red-600">{uploadError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={reset}
                className="flex-1 h-10 rounded-lg text-[14px] font-semibold border-gray-200"
              >
                다시 선택
              </Button>
              <Button
                onClick={handleUpload}
                disabled={validRows.length === 0}
                className="flex-1 h-10 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
              >
                {validRows.length}건 등록하기
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 업로드 중 */}
        {step === 'uploading' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-[14px] text-gray-500">업로드 중...</p>
          </div>
        )}

        {/* Step 4: 완료 */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <p className="text-[16px] font-semibold text-gray-900">
              {validRows.length}건 등록 완료
            </p>
            <Button
              onClick={() => {
                handleOpenChange(false)
                onSuccess()
              }}
              className="mt-2 h-10 px-6 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90"
            >
              확인
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

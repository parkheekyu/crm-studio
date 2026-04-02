'use client'

import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuccessClientProps {
  error: string | null
  amount: number
  workspaceId: string
}

export default function SuccessClient({ error, amount, workspaceId }: SuccessClientProps) {
  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-[18px] font-bold text-gray-900">결제 실패</h2>
        <p className="text-[14px] text-gray-500">{error}</p>
        <Link href={`/workspace/${workspaceId}/settings`}>
          <Button className="mt-4 h-10 px-6 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
            돌아가기
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
      <h2 className="text-[18px] font-bold text-gray-900">충전 완료!</h2>
      <p className="text-[14px] text-gray-500">
        <span className="font-bold text-primary">{amount.toLocaleString()}원</span>이 크레딧에 충전되었습니다.
      </p>
      <div className="flex gap-2 justify-center mt-4">
        <Link href={`/workspace/${workspaceId}/settings`}>
          <Button variant="outline" className="h-10 px-5 rounded-lg text-[14px] font-semibold border-gray-200">
            설정으로 이동
          </Button>
        </Link>
        <Link href="/campaigns/new">
          <Button className="h-10 px-5 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
            메시지 발송하기
          </Button>
        </Link>
      </div>
    </div>
  )
}

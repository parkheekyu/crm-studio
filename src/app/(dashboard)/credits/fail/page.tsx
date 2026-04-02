'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FailPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.'
  const code = searchParams.get('code')

  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
      <h2 className="text-[18px] font-bold text-gray-900">결제 실패</h2>
      <p className="text-[14px] text-gray-500">{message}</p>
      {code && <p className="text-[12px] text-gray-400">오류 코드: {code}</p>}
      <Link href="/credits/charge">
        <Button className="mt-4 h-10 px-6 rounded-lg text-[14px] font-semibold bg-primary hover:bg-primary/90">
          다시 시도
        </Button>
      </Link>
    </div>
  )
}

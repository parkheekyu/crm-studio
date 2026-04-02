'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Coins } from 'lucide-react'

interface CreditPanelProps {
  workspaceId: string
  balance: number
}

export default function CreditPanel({ workspaceId, balance }: CreditPanelProps) {
  return (
    <div className="space-y-4">
      {/* 잔액 표시 */}
      <div className="bg-primary/5 rounded-xl p-5 text-center">
        <p className="text-[13px] text-gray-500 mb-1">현재 잔액</p>
        <p className="text-[28px] font-bold text-primary">
          {balance.toLocaleString()}<span className="text-[16px] font-medium ml-1">원</span>
        </p>
      </div>

      {/* 단가 안내 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'SMS', price: '18원' },
          { label: 'LMS', price: '45원' },
          { label: '알림톡', price: '13원' },
          { label: 'MMS', price: '110원' },
          { label: '친구톡', price: '15원' },
          { label: '이메일', price: '무료' },
        ].map((item) => (
          <div key={item.label} className="bg-gray-50 rounded-lg px-2 py-2">
            <p className="text-[11px] text-gray-400">{item.label}</p>
            <p className="text-[13px] font-semibold text-gray-700">{item.price}</p>
          </div>
        ))}
      </div>

      {/* 충전 버튼 → 결제 페이지 */}
      <Link href="/credits/charge">
        <Button className="w-full h-10 rounded-xl text-[14px] font-semibold bg-primary hover:bg-primary/90">
          <Coins className="w-4 h-4 mr-1.5" />
          크레딧 충전하기
        </Button>
      </Link>
    </div>
  )
}

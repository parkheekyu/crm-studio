'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!

const CHARGE_OPTIONS = [
  { amount: 5000, label: '5,000원' },
  { amount: 10000, label: '10,000원' },
  { amount: 30000, label: '30,000원' },
  { amount: 50000, label: '50,000원' },
  { amount: 100000, label: '100,000원' },
]

interface ChargeClientProps {
  workspaceId: string
  balance: number
  userEmail: string
  userName: string
}

export default function ChargeClient({ workspaceId, balance, userEmail, userName }: ChargeClientProps) {
  const [selectedAmount, setSelectedAmount] = useState(10000)
  const [loading, setLoading] = useState(false)
  const [widgetReady, setWidgetReady] = useState(false)
  const widgetRef = useRef<any>(null)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v2/standard'
    script.onload = async () => {
      try {
        const tossPayments = (window as any).TossPayments(CLIENT_KEY)
        const widgets = tossPayments.widgets({ customerKey: `ws_${workspaceId.replace(/-/g, '').slice(0, 20)}` })

        await widgets.setAmount({ currency: 'KRW', value: selectedAmount })
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
        })

        widgetRef.current = widgets
        setWidgetReady(true)
      } catch (err) {
        console.error('위젯 초기화 실패:', err)
      }
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.setAmount({ currency: 'KRW', value: selectedAmount })
    }
  }, [selectedAmount])

  const handlePayment = async () => {
    if (!widgetRef.current) return
    setLoading(true)

    try {
      const orderId = `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

      await widgetRef.current.requestPayment({
        orderId,
        orderName: `크레딧 충전 ${selectedAmount.toLocaleString()}원`,
        customerEmail: userEmail,
        customerName: userName,
        successUrl: `${window.location.origin}/credits/success?workspaceId=${workspaceId}&amount=${selectedAmount}`,
        failUrl: `${window.location.origin}/credits/fail`,
      })
    } catch (err: any) {
      if (err.code !== 'USER_CANCEL') {
        console.error('결제 요청 실패:', err)
      }
    }

    setLoading(false)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/workspace/${workspaceId}/settings`} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">크레딧 충전</h2>
      </div>

      <div className="bg-primary/5 rounded-xl p-5 text-center">
        <p className="text-[13px] text-gray-500 mb-1">현재 잔액</p>
        <p className="text-[28px] font-bold text-primary">
          {balance.toLocaleString()}<span className="text-[16px] font-medium ml-1">원</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h3 className="text-[15px] font-semibold text-gray-900">충전 금액</h3>
        <div className="grid grid-cols-3 gap-2">
          {CHARGE_OPTIONS.map((opt) => (
            <button
              key={opt.amount}
              type="button"
              onClick={() => setSelectedAmount(opt.amount)}
              className={`h-11 rounded-lg text-[14px] font-semibold border transition-colors ${
                selectedAmount === opt.amount
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          {[
            { label: 'SMS', price: 18 },
            { label: 'LMS', price: 45 },
            { label: '알림톡', price: 13 },
          ].map((item) => (
            <div key={item.label} className="text-center py-2">
              <p className="text-[11px] text-gray-400">{item.label} ({item.price}원)</p>
              <p className="text-[14px] font-bold text-gray-700">약 {Math.floor(selectedAmount / item.price)}건</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">결제 수단</h3>
        <div id="payment-method" className="min-h-[50px]" />
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading || !widgetReady}
        className="w-full h-12 rounded-xl text-[15px] font-semibold bg-primary hover:bg-primary/90"
      >
        <Coins className="w-5 h-5 mr-2" />
        {loading ? '결제 진행 중...' : `${selectedAmount.toLocaleString()}원 결제하기`}
      </Button>
    </div>
  )
}

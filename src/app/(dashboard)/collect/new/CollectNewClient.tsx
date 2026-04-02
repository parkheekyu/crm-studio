'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Webhook } from 'lucide-react'

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="24" fill="#1877F2" />
      <path d="M33 24.1h-5.4v15.9h-6.6V24.1H17v-5.6h4V15c0-4.2 1.8-6.8 6.8-6.8H32v5.6h-2.6c-2 0-2 .8-2 2.2v2.5h4.6l-1 5.6z" fill="white" />
    </svg>
  )
}

function GoogleSheetsLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none">
      <path d="M28 4H12a4 4 0 00-4 4v32a4 4 0 004 4h24a4 4 0 004-4V16l-12-12z" fill="#0F9D58" />
      <path d="M28 4v12h12" fill="#87CEAC" />
      <rect x="14" y="24" width="20" height="14" rx="1" fill="white" opacity="0.9" />
      <line x1="14" y1="29" x2="34" y2="29" stroke="#0F9D58" strokeWidth="1" />
      <line x1="14" y1="34" x2="34" y2="34" stroke="#0F9D58" strokeWidth="1" />
      <line x1="22" y1="24" x2="22" y2="38" stroke="#0F9D58" strokeWidth="1" />
    </svg>
  )
}

const SOURCE_TYPES = [
  {
    type: 'facebook',
    label: '페이스북 인스턴트 양식',
    description: 'Facebook 리드 광고에서 수집된 리드를 자동 연동합니다.',
    href: '/collect/new/facebook',
    logo: <FacebookLogo className="w-12 h-12" />,
  },
  {
    type: 'google_sheets',
    label: '구글 스프레드시트',
    description: 'Google Sheets에서 리드 데이터를 자동으로 가져옵니다.',
    href: '/collect/new/sheets',
    logo: <GoogleSheetsLogo className="w-12 h-12" />,
  },
  {
    type: 'webhook',
    label: '웹훅',
    description: '외부 서비스에서 웹훅 URL로 리드를 자동 전송합니다.',
    href: '/collect/new/webhook',
    logo: (
      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
        <Webhook className="w-6 h-6 text-purple-600" />
      </div>
    ),
  },
  {
    type: 'form',
    label: '리드폼 생성하기',
    description: '직접 리드 수집 폼을 만들어 랜딩페이지에 연결합니다.',
    href: '/collect/new/form',
    logo: (
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <FileText className="w-6 h-6 text-gray-600" />
      </div>
    ),
  },
]

export default function CollectNewClient() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link href="/collect" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">수집 채널 추가</h2>
          <p className="text-[14px] text-gray-500 mt-0.5">리드를 수집할 채널을 선택하세요</p>
        </div>
      </div>

      {/* 카드 선택 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SOURCE_TYPES.map((item) => (
          <Link
            key={item.type}
            href={item.href}
            className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 hover:border-primary/30 hover:shadow-md transition-all flex flex-col items-center text-center gap-4 group"
          >
            <div className="group-hover:scale-105 transition-transform">
              {item.logo}
            </div>
            <div>
              <p className="text-[15px] font-semibold text-gray-900">{item.label}</p>
              <p className="text-[12px] text-gray-400 mt-1 leading-relaxed">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

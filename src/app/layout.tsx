import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CRM Studio — 리드 수집부터 메시지 발송까지',
  description: '리드 수집, CRM 시나리오, 메시지 발송을 한 곳에서 관리하세요.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

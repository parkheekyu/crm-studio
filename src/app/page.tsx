import Link from 'next/link'
import { ArrowRight, Users, Send, BarChart2, Zap } from 'lucide-react'

const features = [
  {
    icon: Users,
    title: '스마트 리드 수집',
    desc: '랜딩 빌더, 폼, CSV 업로드, 외부 연동까지 다양한 방식으로 리드를 수집하세요.',
    color: 'bg-blue-50 text-blue-500',
  },
  {
    icon: Send,
    title: 'CRM 시나리오 발송',
    desc: 'Solapi 기반 문자, 알림톡, 친구톡을 D-day 혹은 순차 시나리오로 자동 발송합니다.',
    color: 'bg-violet-50 text-violet-500',
  },
  {
    icon: BarChart2,
    title: '성과 분석',
    desc: '발송 로그, 오픈율, 클릭율, 전환율을 한눈에 파악하고 최적화하세요.',
    color: 'bg-emerald-50 text-emerald-500',
  },
  {
    icon: Zap,
    title: '빠른 설정',
    desc: '복잡한 마케팅 도구 없이 5분 안에 첫 CRM 시나리오를 시작하세요.',
    color: 'bg-orange-50 text-orange-500',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-[15px] text-gray-900 tracking-tight">
              CRM Studio
            </span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-[13px] font-semibold hover:bg-primary/90 transition-colors"
          >
            시작하기
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[12px] font-semibold text-primary">지금 바로 시작하세요</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
          리드 수집부터<br />
          <span className="text-primary">메시지 발송까지</span>,<br />
          한 곳에서
        </h1>
        <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
          DB카트처럼 리드를 모으고, Solapi로 문자·알림톡을 자동 발송하는
          올인원 CRM 서비스입니다.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white font-semibold text-[15px] hover:bg-primary/90 transition-colors shadow-lg shadow-blue-200"
          >
            무료로 시작하기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 기능 카드 */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${feature.color} mb-4`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-[12px] text-gray-400">
            © 2025 CRM Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

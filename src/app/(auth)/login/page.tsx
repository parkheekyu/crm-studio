import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      {/* 로고 영역 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4">
          <span className="text-white font-bold text-xl">C</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          CRM Studio
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">
          리드 수집부터 메시지 발송까지, 한 곳에서
        </p>
      </div>

      {/* 로그인 폼 */}
      <LoginForm />

      {/* 약관 */}
      <p className="mt-6 text-center text-xs text-gray-400 leading-relaxed">
        로그인 시{' '}
        <a href="#" className="underline underline-offset-2 hover:text-gray-600">
          이용약관
        </a>
        {' '}및{' '}
        <a href="#" className="underline underline-offset-2 hover:text-gray-600">
          개인정보처리방침
        </a>
        에 동의하게 됩니다.
      </p>
    </div>
  )
}

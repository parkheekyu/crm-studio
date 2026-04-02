'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 12c0 3.863 2.188 7.207 5.388 8.941L6.5 23.5l3.662-2.415A10.67 10.67 0 0012 21c5.523 0 10-4.477 10-10S17.523 3 12 3zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8a8.668 8.668 0 01-1.71-.173L8.5 22l.844-3.253A8 8 0 0112 5z" />
      <path d="M8.5 10.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5S10.828 12 10 12s-1.5-.672-1.5-1.5zm5 0c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5-1.5-.672-1.5-1.5z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export default function LoginForm() {
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<
    'kakao' | 'google' | null
  >(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  const handleOAuthLogin = async (provider: 'kakao' | 'google') => {
    setLoadingProvider(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password.trim()) return

    if (isSignUp) {
      if (!fullName.trim()) {
        setEmailError('이름을 입력해 주세요.')
        return
      }
      if (password !== passwordConfirm) {
        setEmailError('비밀번호가 일치하지 않습니다.')
        return
      }
      if (password.length < 6) {
        setEmailError('비밀번호는 6자 이상이어야 합니다.')
        return
      }
    }

    setEmailLoading(true)
    setEmailError(null)
    setEmailSuccess(null)

    const supabase = createClient()

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })
      if (error) {
        setEmailError(error.message)
      } else if (data.session) {
        // 이메일 확인 꺼져있으면 바로 세션 발급
        window.location.href = '/dashboard'
        return
      } else {
        setEmailSuccess('가입 완료! 이메일 확인 후 로그인해 주세요.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) {
        setEmailError(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message)
      } else {
        window.location.href = '/dashboard'
        return
      }
    }

    setEmailLoading(false)
  }

  return (
    <div className="space-y-4">
      {/* 이메일 로그인/회원가입 */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="login-name" className="text-[13px] font-semibold text-gray-700">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="login-name"
              type="text"
              placeholder="홍길동"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-[13px]"
              required
              autoFocus
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="login-email" className="text-[13px] font-semibold text-gray-700">
            이메일 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="login-email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-xl border-gray-200 text-[13px]"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password" className="text-[13px] font-semibold text-gray-700">
            비밀번호 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="login-password"
            type="password"
            placeholder="6자 이상"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-xl border-gray-200 text-[13px]"
            required
            minLength={6}
          />
        </div>

        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="login-password-confirm" className="text-[13px] font-semibold text-gray-700">
              비밀번호 확인 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="login-password-confirm"
              type="password"
              placeholder="비밀번호를 다시 입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="h-10 rounded-xl border-gray-200 text-[13px]"
              required
              minLength={6}
            />
          </div>
        )}

        {emailError && (
          <p className="text-[12px] text-red-500">{emailError}</p>
        )}
        {emailSuccess && (
          <p className="text-[12px] text-green-600">{emailSuccess}</p>
        )}

        <Button
          type="submit"
          disabled={emailLoading || !email.trim() || !password.trim()}
          className="w-full h-11 rounded-xl font-semibold text-[14px] bg-primary hover:bg-primary/90"
        >
          {emailLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isSignUp ? (
            '회원가입'
          ) : (
            '로그인'
          )}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => { setIsSignUp(!isSignUp); setEmailError(null); setEmailSuccess(null) }}
        className="w-full text-center text-[12px] text-gray-400 hover:text-gray-600"
      >
        {isSignUp ? '이미 계정이 있으신가요? 로그인' : '계정이 없으신가요? 회원가입'}
      </button>

      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">또는</span>
        </div>
      </div>

      {/* 소셜 로그인 */}
      <Button
        onClick={() => handleOAuthLogin('kakao')}
        disabled={loadingProvider !== null}
        className="w-full h-12 rounded-xl font-semibold text-[15px] text-[#191600]"
        style={{ backgroundColor: '#FEE500' }}
        variant="outline"
      >
        {loadingProvider === 'kakao' ? (
          <div className="w-5 h-5 border-2 border-[#191600]/30 border-t-[#191600] rounded-full animate-spin" />
        ) : (
          <KakaoIcon />
        )}
        카카오로 시작하기
      </Button>

      <Button
        onClick={() => handleOAuthLogin('google')}
        disabled={loadingProvider !== null}
        className="w-full h-12 rounded-xl font-semibold text-[15px] text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
        variant="outline"
      >
        {loadingProvider === 'google' ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Google로 시작하기
      </Button>
    </div>
  )
}

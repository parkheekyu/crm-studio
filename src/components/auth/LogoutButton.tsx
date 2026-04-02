'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading}
      variant="outline"
      className="h-10 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-[13px]"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      로그아웃
    </Button>
  )
}

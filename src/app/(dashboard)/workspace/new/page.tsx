import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import WorkspaceCreateForm from '@/components/workspace/WorkspaceCreateForm'
import { Building2 } from 'lucide-react'

export default async function WorkspaceNewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg mx-auto pt-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            워크스페이스 만들기
          </h2>
          <p className="mt-2 text-[14px] text-gray-500">
            팀과 함께 사용할 워크스페이스를 생성하세요.
          </p>
        </div>

        <WorkspaceCreateForm />
      </div>
    </div>
  )
}

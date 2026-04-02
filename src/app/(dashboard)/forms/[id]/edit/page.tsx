import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FormEditClient from './FormEditClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function FormEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: form } = await supabase
    .from('landing_forms')
    .select('*')
    .eq('id', id)
    .single()

  if (!form) notFound()

  return <FormEditClient form={form} />
}

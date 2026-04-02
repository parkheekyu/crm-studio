'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Workspace } from '@/types'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('workspaces')
        .select('*, workspace_members!inner(user_id)')
        .order('created_at', { ascending: true })

      if (data) {
        setWorkspaces(data as Workspace[])
      }
      setLoading(false)
    }

    fetchWorkspaces()
  }, [])

  return { workspaces, loading }
}

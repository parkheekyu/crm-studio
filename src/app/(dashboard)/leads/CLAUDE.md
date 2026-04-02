# app/(dashboard)/leads/ — 리드 관리 라우트

## 파일 구조
| 파일 | 역할 |
|------|------|
| `page.tsx` | 서버 컴포넌트 — 인증 확인, 워크스페이스/리드 목록 fetch |
| `LeadsClient.tsx` | 클라이언트 컴포넌트 — 모달 상태, LeadList + LeadCreateModal 렌더링 |

## 데이터 패칭 패턴
```ts
// page.tsx (서버)
const supabase = await createClient()
const { data: leads } = await supabase
  .from('leads')
  .select('*')
  .eq('workspace_id', workspaceId)
  .order('created_at', { ascending: false })
```

## 새로고침 패턴
- `router.refresh()` — Next.js Server Component 재렌더링으로 목록 갱신
- LeadCreateModal의 `onSuccess` → LeadsClient의 `router.refresh()` 호출

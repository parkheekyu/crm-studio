# Supabase SSR 사용 가이드

## 클라이언트 선택 기준

| 사용 위치 | 클라이언트 | 파일 |
|-----------|-----------|------|
| 클라이언트 컴포넌트 (`'use client'`) | `createBrowserClient` | `client.ts` |
| 서버 컴포넌트 | `createServerClient` | `server.ts` |
| Server Actions | `createServerClient` | `server.ts` |
| API Route (`route.ts`) | `createServerClient` | `server.ts` |
| `middleware.ts` | 인라인 `createServerClient` | `middleware.ts` |

## 사용 예시

### 클라이언트 컴포넌트
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('profiles').select()
```

### 서버 컴포넌트 / Server Action
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()  // ← async 필수
const { data: { user } } = await supabase.auth.getUser()
```

## middleware.ts 주의사항
- `getUser()` 반드시 호출 → JWT 토큰 서버 재검증 + 세션 자동 갱신
- `getSession()`은 보안상 사용 금지 (클라이언트 쿠키만 확인, 서버 검증 없음)
- `supabaseResponse`를 반드시 반환해야 Set-Cookie 헤더가 전파됨

## RLS 정책 패턴

### 워크스페이스 멤버만 접근 가능
```sql
CREATE POLICY "workspace_data_access" ON public.your_table
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

### 본인 데이터만 접근 가능
```sql
CREATE POLICY "own_data_access" ON public.your_table
  FOR ALL USING (auth.uid() = user_id);
```

# supabase/ — DB 스키마 & RLS 패턴

## Phase 1 테이블 (현재)
| 테이블 | 역할 |
|--------|------|
| `profiles` | auth.users 확장 (이름, 아바타) |
| `workspaces` | 멀티테넌시 단위 |
| `workspace_members` | 유저↔워크스페이스 소속 + 역할 |

## 트리거 (자동 실행)
- `on_auth_user_created` → 신규 로그인 시 `profiles` 레코드 자동 생성
- `on_workspace_created` → 워크스페이스 생성 시 오너를 `workspace_members`에 자동 추가

## RLS 정책 패턴
```sql
-- 워크스페이스 멤버만 접근 (Phase 2+ 모든 비즈니스 테이블에 적용)
CREATE POLICY "..." ON public.your_table
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid()
    )
  );
```

## Phase 2+ 테이블 추가 시 규칙
1. 모든 테이블에 `workspace_id UUID NOT NULL REFERENCES workspaces(id)` FK 필수
2. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 필수
3. 워크스페이스 멤버 기반 RLS 정책 적용
4. `src/types/database.types.ts`에 타입 추가 (또는 CLI로 재생성)

## CLI 워크플로우
```bash
# 프로젝트 연결 (최초 1회, 터미널 직접 실행)
npx supabase login
npx supabase link --project-ref [PROJECT_REF]

# 타입 재생성 (테이블 변경 시마다)
npm run db:types   # → src/types/database.types.ts 자동 업데이트

# 스키마 관리
npm run db:push    # 로컬 migrations → Supabase 반영
npm run db:pull    # Supabase 현재 스키마 → 로컬 pull
```

## 스키마 파일
- 전체 DDL: `schema.sql` (Supabase SQL Editor 또는 `db:push`로 실행)

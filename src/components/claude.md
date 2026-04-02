# src/components/ — 컴포넌트 & 디자인 시스템

## 폴더 구조
```
components/
├── ui/           # shadcn/ui 자동생성 — 직접 편집 최소화
├── auth/         # LoginForm, LogoutButton
├── layout/       # Sidebar, Header
└── workspace/    # WorkspaceSwitcher, WorkspaceCreateForm
```

## 디자인 시스템 (Toss Ads 컨셉)
- **Primary:** `#3182f6` (CSS var: `--primary`)
- **카드:** `bg-white border border-gray-100 rounded-2xl shadow-sm`
- **버튼(CTA):** `bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl`
- **간격:** 24px / 32px 기반 일관된 padding
- **폰트:** Pretendard Variable (웹폰트, globals.css에서 로드)
- **텍스트 크기:** 제목 `text-[15px]`, 본문 `text-[13px]`, 캡션 `text-[11px]`

## shadcn/ui v4 주의사항 (Base UI 기반)
- `DropdownMenuTrigger`: `asChild` 미지원 → `className`으로 직접 스타일링
- 새 컴포넌트 추가: `npx shadcn@latest add [name]`

## 공통 패턴
```tsx
// 카드 컴포넌트 래퍼
<div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

// 섹션 타이틀
<h3 className="text-[14px] font-semibold text-gray-900 mb-4">

// 보조 텍스트
<p className="text-[13px] text-gray-500">
```

import type { Lead } from '@/types'

/**
 * 템플릿에서 #{변수명} 추출
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/#\{([^}]+)\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -1)))]
}

/**
 * Lead 필드 → 변수명 매핑
 */
const LEAD_FIELD_MAP: Record<string, keyof Lead> = {
  이름: 'name',
  전화번호: 'phone',
  이메일: 'email',
}

/**
 * 변수명 → 사용 가능한 변수 목록 (TemplateEditor에서 사용)
 */
export const AVAILABLE_VARIABLES = [
  { key: '이름', label: '이름', field: 'name' as const },
  { key: '전화번호', label: '전화번호', field: 'phone' as const },
  { key: '이메일', label: '이메일', field: 'email' as const },
]

/**
 * 템플릿 + Lead → 치환된 메시지 (미리보기 용)
 */
export function previewMessage(template: string, lead: Lead): string {
  let result = template
  for (const [varName, fieldKey] of Object.entries(LEAD_FIELD_MAP)) {
    const value = lead[fieldKey] ?? ''
    result = result.replaceAll(`#{${varName}}`, String(value))
  }
  return result
}

/**
 * Solapi replacements 배열 생성
 */
export function buildReplacements(
  leads: Lead[],
  template: string
): Record<string, string>[] {
  const vars = extractVariables(template)
  return leads.map((lead) => {
    const replacement: Record<string, string> = {}
    for (const varName of vars) {
      const fieldKey = LEAD_FIELD_MAP[varName]
      if (fieldKey) {
        replacement[varName] = String(lead[fieldKey] ?? '')
      }
    }
    return replacement
  })
}

/**
 * 한글 포함 바이트 수 계산 (SMS: 90바이트, LMS: 2000바이트)
 */
export function getByteLength(str: string): number {
  let bytes = 0
  for (const char of str) {
    bytes += char.charCodeAt(0) > 127 ? 2 : 1
  }
  return bytes
}

/**
 * 바이트 수 기반 메시지 타입 자동 감지
 */
export function detectMessageType(text: string): 'SMS' | 'LMS' {
  return getByteLength(text) > 90 ? 'LMS' : 'SMS'
}

/**
 * variable_bindings 기반 메시지 치환
 * bindings: { "변수A": { type: "field", value: "name" }, "변수B": { type: "fixed", value: "https://..." } }
 */
export function applyVariableBindings(
  template: string,
  bindings: Record<string, { type: 'field' | 'fixed'; value: string }>,
  lead: Lead
): string {
  let result = template
  for (const [varName, binding] of Object.entries(bindings)) {
    const resolved = binding.type === 'fixed'
      ? binding.value
      : String((lead as any)[binding.value] ?? '')
    result = result.replaceAll(`#{${varName}}`, resolved)
  }
  return result
}

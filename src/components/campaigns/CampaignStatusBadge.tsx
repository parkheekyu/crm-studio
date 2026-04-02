const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: '초안', className: 'bg-gray-100 text-gray-500' },
  sending: { label: '발송 중', className: 'bg-blue-50 text-blue-600' },
  completed: { label: '완료', className: 'bg-green-50 text-green-600' },
  failed: { label: '실패', className: 'bg-red-50 text-red-500' },
}

export default function CampaignStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}

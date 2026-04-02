'use client'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg?: string
}

export default function StatCard({ icon, label, value, sub, iconBg = 'bg-blue-50' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-[24px] font-bold text-gray-900 leading-tight">{value}</p>
          <p className="text-[13px] text-gray-500 mt-0.5">{label}</p>
          {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { MessageTypeDistribution } from '@/types/analytics'

const COLORS: Record<string, string> = {
  SMS: '#3182f6',
  LMS: '#6366f1',
  ATA: '#f59e0b',
  FTA: '#10b981',
}

interface MessageTypeChartProps {
  data: MessageTypeDistribution[]
}

export default function MessageTypeChart({ data }: MessageTypeChartProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[13px] text-gray-400">
        발송 데이터가 없습니다.
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="flex items-center gap-6">
      <div className="w-[160px] h-[160px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              strokeWidth={2}
              stroke="#fff"
            >
              {data.map((entry) => (
                <Cell key={entry.type} fill={COLORS[entry.type] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
              formatter={(value) => [`${value}건`, '']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-2.5">
        {data.map((item) => (
          <div key={item.type} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: COLORS[item.type] ?? '#94a3b8' }}
            />
            <span className="text-[13px] text-gray-600 flex-1">{item.label}</span>
            <span className="text-[13px] font-semibold text-gray-900">{item.count}건</span>
            <span className="text-[11px] text-gray-400 w-10 text-right">
              {total > 0 ? Math.round((item.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

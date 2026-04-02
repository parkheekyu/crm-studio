'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { DailySendData } from '@/types/analytics'

interface DailySendChartProps {
  data: DailySendData[]
}

export default function DailySendChart({ data }: DailySendChartProps) {
  if (data.length === 0 || data.every((d) => d.total === 0)) {
    return (
      <div className="flex items-center justify-center h-[240px] text-[13px] text-gray-400">
        발송 데이터가 없습니다.
      </div>
    )
  }

  const formatted = data.map((d) => ({
    ...d,
    label: `${d.date.slice(5, 7)}/${d.date.slice(8, 10)}`,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            fontSize: 12,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
          }}
          formatter={(value, name) => [
            `${value}건`,
            name === 'campaign' ? '캠페인' : '시나리오',
          ]}
          labelFormatter={(label) => label}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12 }}
          formatter={(value: string) => (value === 'campaign' ? '캠페인' : '시나리오')}
        />
        <Bar
          dataKey="campaign"
          stackId="a"
          fill="#3182f6"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="scenario"
          stackId="a"
          fill="#a78bfa"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

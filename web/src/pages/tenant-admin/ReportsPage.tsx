import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useTenantFilterStore } from '@/store/tenantFilter'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { QueryError } from '@/components/QueryError'

const placeholderData = [
  { date: '-', hour: '00:00', kWh: 0 },
  { date: '-', hour: '06:00', kWh: 5 },
  { date: '-', hour: '12:00', kWh: 25 },
  { date: '-', hour: '18:00', kWh: 45 },
  { date: '-', hour: '24:00', kWh: 15 },
]

export function ReportsPage() {
  const [period, setPeriod] = useState<'day' | 'week'>('week')
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: usageData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['stats-usage', period, effectiveTenantId],
    queryFn: () =>
      api
        .get<{ date: string; kwh: number; sessionCount: number }[]>('/stats/usage', {
          params: { period, ...(effectiveTenantId && { tenantId: effectiveTenantId }) },
        })
        .then((r) => r.data),
  })

  const chartData =
    usageData.length > 0
      ? usageData.map((u) => ({
          date: u.date,
          hour: u.date,
          kWh: u.kwh,
        }))
      : placeholderData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Reports</h1>
          <p className="text-[#64748B]">Usage analytics and peak charging hours</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('day')}
            className={`rounded border-2 px-3 py-1.5 text-sm font-medium ${
              period === 'day'
                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                : 'border-[#0F172A] bg-white hover:bg-slate-50'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`rounded border-2 px-3 py-1.5 text-sm font-medium ${
              period === 'week'
                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                : 'border-[#0F172A] bg-white hover:bg-slate-50'
            }`}
          >
            Week
          </button>
        </div>
      </div>
      {isLoading ? (
        <p className="text-[#64748B]">Loading reports...</p>
      ) : isError ? (
        <QueryError message="Failed to load usage data." onRetry={refetch} />
      ) : null}
      <div className="grid gap-6 lg:grid-cols-2" style={{ display: isLoading || isError ? 'none' : undefined }}>
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage (kWh)</CardTitle>
            <CardDescription>Energy consumption over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kWh" fill="#2563EB" stroke="#0F172A" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Peak Charging Hours</CardTitle>
            <CardDescription>Most active hours (same data)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="kWh" fill="#6366F1" stroke="#0F172A" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useTenantFilterStore } from '@/store/tenantFilter'
import {
  Zap,
  DollarSign,
  TrendingUp,
  Building2,
  Calendar,
  Download,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { MapWidget } from '@/components/MapWidget'
import { StatusBadge } from '@/components/StatusBadge'
import { QueryError } from '@/components/QueryError'
import { format, subDays } from 'date-fns'

const CARD_ICON_BG = [
  'bg-amber-100', // yellow - Active Sessions
  'bg-blue-100',  // blue - Revenue
  'bg-emerald-100', // green - Energy
  'bg-violet-100', // purple - Points
]

export function DashboardOverview() {
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()
  const isSuperAdmin = user?.role === 'super_admin'
  const effectiveTenantId = isSuperAdmin ? selectedTenantId ?? undefined : undefined
  const dateRange = {
    start: subDays(new Date(), 30),
    end: new Date(),
  }

  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['stats-overview', effectiveTenantId],
    queryFn: () =>
      api
        .get('/stats/overview', {
          params: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
        })
        .then((r) => r.data),
    enabled: isSuperAdmin || user?.role === 'admin',
  })

  const { data: chargePoints = [] } = useQuery({
    queryKey: ['charge-points', user?.tenantId],
    queryFn: () => api.get('/charge-points').then((r) => r.data),
    enabled: !isSuperAdmin,
  })

  const {
    data: transactions = [],
    isLoading: txLoading,
    isError: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions', effectiveTenantId],
    queryFn: () =>
      api
        .get('/transactions', {
          params: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
        })
        .then((r) => r.data),
    enabled: isSuperAdmin || user?.role === 'admin',
  })

  const cpCount = isSuperAdmin ? (stats?.chargePointCount ?? 0) : (Array.isArray(chargePoints) ? chargePoints.length : 0)
  const energy = stats?.totalEnergyKwh ?? 0
  const revenue = stats?.totalRevenue ?? 0

  const cards = isSuperAdmin
    ? [
        { title: 'Active Sessions', value: '0', change: '+0%', changePositive: true, icon: Zap, iconBg: CARD_ICON_BG[0] },
        { title: 'Total Revenue', value: `₺${revenue.toFixed(2)}`, change: '+0%', changePositive: true, icon: DollarSign, iconBg: CARD_ICON_BG[1] },
        { title: 'Energy Dispensed', value: `${energy.toFixed(1)} kWh`, change: '-0%', changePositive: false, icon: TrendingUp, iconBg: CARD_ICON_BG[2] },
        { title: 'Active Points', value: `${cpCount}/50`, badge: 'Optimal', icon: Building2, iconBg: CARD_ICON_BG[3] },
      ]
    : [
        { title: 'Charge Points', value: String(cpCount), icon: Zap, iconBg: CARD_ICON_BG[0] },
        { title: 'Total Revenue', value: `₺${revenue.toFixed(2)}`, icon: DollarSign, iconBg: CARD_ICON_BG[1] },
        { title: 'Energy Dispensed', value: `${energy.toFixed(1)} kWh`, icon: TrendingUp, iconBg: CARD_ICON_BG[2] },
      ]

  const recentTx = Array.isArray(transactions) ? transactions.slice(0, 5) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Dashboard Overview</h1>
          <p className="text-[#64748B]">
            Real-time performance metrics for your EV network.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded border border-[#0F172A] bg-white px-3 py-2">
            <Calendar className="h-4 w-4 text-[#64748B]" />
            <span className="text-sm text-[#0F172A]">
              {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
            </span>
          </div>
          <Button disabled title="Coming soon">
            <Download className="h-4 w-4" />
            Report
          </Button>
        </div>
      </div>

      {statsLoading ? (
        <div className="py-8 text-center text-[#64748B]">Loading dashboard...</div>
      ) : statsError ? (
        <QueryError message="Failed to load dashboard stats." onRetry={refetchStats} />
      ) : null}

      {!statsLoading && !statsError && (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const { title, value, icon: Icon, iconBg } = card
          const change = 'change' in card ? card.change : undefined
          const changePositive = 'changePositive' in card ? card.changePositive : undefined
          const badge = 'badge' in card ? card.badge : undefined
          return (
          <Card key={title} className="border border-[#0F172A]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
                <Icon className="h-5 w-5 text-[#0F172A]" />
              </div>
              {badge && (
                <span className="rounded-full bg-[#2563EB] px-2.5 py-0.5 text-xs font-medium text-white">
                  {badge}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-[#64748B]">{title}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0F172A]">{value}</span>
                {change && (
                  <span className={`text-sm font-medium ${changePositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {change}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          )
        })}
      </div>
      )}

      {isSuperAdmin && <MapWidget />}

      <Card className="border border-[#0F172A]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <p className="text-sm text-[#64748B]">Latest charging sessions</p>
          </div>
          <Link to="/transactions" className="text-sm font-medium text-[#2563EB] hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#0F172A]">
                <TableHead className="font-semibold">SESSION ID</TableHead>
                <TableHead className="font-semibold">CHARGE POINT</TableHead>
                <TableHead className="font-semibold">DURATION</TableHead>
                <TableHead className="font-semibold">ENERGY (KWH)</TableHead>
                <TableHead className="font-semibold">TOTAL COST</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {txLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#64748B]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : txError ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <QueryError message="Failed to load transactions." onRetry={refetchTx} />
                  </TableCell>
                </TableRow>
              ) : recentTx.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-[#64748B]">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentTx.map((tx: { id: string; chargePointId: string; startTime: string; endTime?: string | null; kwh?: string | null; cost?: string | null }) => {
                  const start = new Date(tx.startTime)
                  const end = tx.endTime ? new Date(tx.endTime) : null
                  const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) + ' min' : '-'
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">{tx.id.slice(0, 8)}...</TableCell>
                      <TableCell>{tx.chargePointId}</TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell>{tx.kwh ?? '-'}</TableCell>
                      <TableCell className="font-semibold">{tx.cost != null ? `₺${tx.cost}` : '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={tx.endTime ? 'completed' : 'charging'} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

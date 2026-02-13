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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/StatusBadge'
import { format } from 'date-fns'

export function TransactionsPage() {
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', effectiveTenantId],
    queryFn: () =>
      api
        .get('/transactions', {
          params: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
        })
        .then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Transactions</h1>
        <p className="text-[#64748B]">All charging sessions</p>
      </div>
      <Card className="border border-[#0F172A]">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Charging session history</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#0F172A]">
                <TableHead className="font-semibold">SESSION ID</TableHead>
                <TableHead className="font-semibold">CHARGE POINT</TableHead>
                <TableHead className="font-semibold">USER</TableHead>
                <TableHead className="font-semibold">START TIME</TableHead>
                <TableHead className="font-semibold">DURATION</TableHead>
                <TableHead className="font-semibold">ENERGY (KWH)</TableHead>
                <TableHead className="font-semibold">TOTAL COST</TableHead>
                <TableHead className="font-semibold">STATUS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-[#64748B]">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-[#64748B]">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: {
                  id: string
                  chargePointId: string
                  startTime: string
                  endTime?: string | null
                  kwh?: string | null
                  cost?: string | null
                  user?: { email?: string; name?: string } | null
                }) => {
                  const start = new Date(tx.startTime)
                  const end = tx.endTime ? new Date(tx.endTime) : null
                  const duration = end ? Math.round((end.getTime() - start.getTime()) / 60000) + ' min' : '-'
                  const userDisplay = tx.user ? (tx.user.name || tx.user.email) : (tx as { idTag?: string })?.idTag ?? '-'
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-sm">{tx.id.slice(0, 8)}...</TableCell>
                      <TableCell>{tx.chargePointId}</TableCell>
                      <TableCell className="text-sm">{userDisplay}</TableCell>
                      <TableCell>{format(start, 'PPp')}</TableCell>
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

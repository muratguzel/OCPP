import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
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
import { format, formatDistanceStrict } from 'date-fns'
import { QueryError } from '@/components/QueryError'

interface Transaction {
  id: string
  chargePointId: string
  startTime: string
  endTime?: string | null
  kwh?: string | null
  cost?: string | null
}

export function ChargingHistoryPage() {
  const { data: transactions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get<Transaction[]>('/transactions').then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Şarj Geçmişi</h1>
        <p className="text-[#64748B]">Geçmiş şarj oturumlarınız</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Geçmiş</CardTitle>
          <CardDescription>Tarih, süre, kWh, tutar ve istasyon bilgisi</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tarih</TableHead>
                <TableHead>Süre</TableHead>
                <TableHead>kWh</TableHead>
                <TableHead>Tutar</TableHead>
                <TableHead>İstasyon</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#64748B]">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <QueryError message="Şarj geçmişi yüklenemedi." onRetry={refetch} />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[#64748B]">
                    Henüz şarj geçmişi yok. Bir istasyonda oturum başlatın.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const start = new Date(tx.startTime)
                  const end = tx.endTime ? new Date(tx.endTime) : null
                  const duration = end
                    ? formatDistanceStrict(start, end)
                    : '-'
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{format(start, 'PPp')}</TableCell>
                      <TableCell>{duration}</TableCell>
                      <TableCell>{tx.kwh ?? '-'}</TableCell>
                      <TableCell>{tx.cost != null ? `₺${tx.cost}` : '-'}</TableCell>
                      <TableCell>{tx.chargePointId}</TableCell>
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

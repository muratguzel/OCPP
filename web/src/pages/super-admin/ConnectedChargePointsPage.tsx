import { useQuery } from '@tanstack/react-query'
import { gatewayApi } from '@/api/client'
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

interface ConnectorRow {
  connectorId: number
  status: string
  errorCode?: string
  timestamp?: string
}

interface ConnectedChargePoint {
  chargePointId: string
  protocol: string
  connectedAt: string
  connectorCount: number
  connectors: ConnectorRow[]
}

async function fetchConnectedChargePoints(): Promise<ConnectedChargePoint[]> {
  if (!gatewayApi) throw new Error('Gateway URL not configured')
  const { data } = await gatewayApi.get<{ chargePoints: ConnectedChargePoint[] }>('/charge-points')
  return data.chargePoints ?? []
}

export function ConnectedChargePointsPage() {
  const { data: chargePoints = [], isLoading, error } = useQuery({
    queryKey: ['gateway', 'charge-points'],
    queryFn: fetchConnectedChargePoints,
    refetchInterval: 10_000,
    enabled: !!gatewayApi,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Bağlı Şarj Noktaları</h1>
        <p className="text-[#64748B]">
          OCPP Gateway (ws) canlı listesi. Bunlar sisteme tanımlı şarj noktaları değil, şu anda gateway'e bağlı olan şarj noktalarıdır.
        </p>
      </div>
      <Card className="border border-[#0F172A]">
        <CardHeader>
          <CardTitle>Gateway bağlı cihaz listesi</CardTitle>
          <CardDescription>
            OCPP gateway canlı verisi — her 10 saniyede yenilenir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#0F172A]">
                <TableHead className="font-semibold">Şarj Noktası ID</TableHead>
                <TableHead className="font-semibold">Protokol</TableHead>
                <TableHead className="font-semibold">Bağlanma Zamanı</TableHead>
                <TableHead className="font-semibold">Konnektörler</TableHead>
                <TableHead className="font-semibold">Konnektör Durumu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-red-600">
                    {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[#64748B]">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : chargePoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[#64748B]">
                    Bağlı şarj noktası yok.
                  </TableCell>
                </TableRow>
              ) : (
                chargePoints.map((cp) => (
                  <TableRow key={cp.chargePointId}>
                    <TableCell className="font-mono font-medium">{cp.chargePointId}</TableCell>
                    <TableCell>{cp.protocol}</TableCell>
                    <TableCell>{format(new Date(cp.connectedAt), 'PPp')}</TableCell>
                    <TableCell>{cp.connectorCount}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {cp.connectors.map((c) => (
                          <StatusBadge
                            key={c.connectorId}
                            status={c.status}
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

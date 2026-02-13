import { useQuery } from '@tanstack/react-query'
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

const GATEWAY_URL = import.meta.env.VITE_OCPP_GATEWAY_URL || 'http://localhost:3000'

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

interface GatewayChargePointsResponse {
  chargePoints: ConnectedChargePoint[]
}

async function fetchConnectedChargePoints(): Promise<ConnectedChargePoint[]> {
  const res = await fetch(`${GATEWAY_URL}/charge-points`)
  if (!res.ok) throw new Error('Failed to fetch connected charge points')
  const data: GatewayChargePointsResponse = await res.json()
  return data.chargePoints ?? []
}

export function ConnectedChargePointsPage() {
  const { data: chargePoints = [], isLoading, error } = useQuery({
    queryKey: ['gateway', 'charge-points'],
    queryFn: fetchConnectedChargePoints,
    refetchInterval: 10_000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Connected Charge Points</h1>
        <p className="text-[#64748B]">
          Live list from OCPP Gateway (ws). These are charge points currently connected to the gateway, not the defined charge points in the system.
        </p>
      </div>
      <Card className="border border-[#0F172A]">
        <CardHeader>
          <CardTitle>Gateway connected list</CardTitle>
          <CardDescription>
            Data from {GATEWAY_URL}/charge-points — refreshes every 10s
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#0F172A]">
                <TableHead className="font-semibold">Charge Point ID</TableHead>
                <TableHead className="font-semibold">Protocol</TableHead>
                <TableHead className="font-semibold">Connected at</TableHead>
                <TableHead className="font-semibold">Connectors</TableHead>
                <TableHead className="font-semibold">Connector status</TableHead>
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
                    Loading...
                  </TableCell>
                </TableRow>
              ) : chargePoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-[#64748B]">
                    No charge points connected.
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

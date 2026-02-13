import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useTenantFilterStore } from '@/store/tenantFilter'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { QRCodeSVG } from 'qrcode.react'

interface ChargePoint {
  id: string
  chargePointId: string
  name?: string | null
  tenantId: string
}

export function QRCodesPage() {
  const { selectedTenantId, setSelectedTenantId } = useTenantFilterStore()
  const [tenantId, setTenantId] = useState(selectedTenantId ?? '')

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
  })

  const { data: chargePoints = [], isLoading } = useQuery({
    queryKey: ['charge-points', tenantId],
    queryFn: () =>
      api
        .get('/charge-points', {
          params: tenantId ? { tenantId } : {},
        })
        .then((r) => r.data),
    enabled: !!tenantId,
  })

  const handleTenantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value
    setTenantId(v)
    setSelectedTenantId(v || null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">QR Codes</h1>
        <p className="text-[#64748B]">
          Generate QR codes for charge points. Only super admin can create QR codes.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
          <CardDescription>
            Choose a tenant to see its charge points and generate QR codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="w-full max-w-xs rounded border-2 border-[#0F172A] px-3 py-2"
            value={tenantId}
            onChange={handleTenantChange}
          >
            <option value="">Select tenant</option>
            {tenants.map((t: { id: string; name: string }) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {tenantId && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            <p className="text-[#64748B]">Loading charge points...</p>
          ) : chargePoints.length === 0 ? (
            <p className="text-[#64748B]">No charge points for this tenant.</p>
          ) : (
            chargePoints.map((cp: ChargePoint) => {
              const qrPayload = JSON.stringify({
                chargePointId: cp.chargePointId,
                name: cp.name || cp.chargePointId,
              })
              return (
                <Card key={cp.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{cp.chargePointId}</CardTitle>
                    <CardDescription>
                      {cp.name || cp.chargePointId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-lg border-2 border-[#0F172A] bg-white p-4">
                        <QRCodeSVG value={qrPayload} size={180} level="M" />
                      </div>
                      <p className="text-center text-xs text-[#64748B]">
                        Scan with mobile app to start charging
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

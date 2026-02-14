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
import { QueryError } from '@/components/QueryError'

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

  const { data: chargePoints = [], isLoading, isError, refetch } = useQuery({
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
        <h1 className="text-2xl font-bold text-[#0F172A]">QR Kodları</h1>
        <p className="text-[#64748B]">
          Şarj noktaları için QR kodları oluşturun. Yalnızca sistem yöneticisi QR kodu oluşturabilir.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Firma Seçin</CardTitle>
          <CardDescription>
            Şarj noktalarını görmek ve QR kodu oluşturmak için bir firma seçin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <select
            className="w-full max-w-xs rounded border-2 border-[#0F172A] px-3 py-2"
            value={tenantId}
            onChange={handleTenantChange}
          >
            <option value="">Firma seçin</option>
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
            <p className="text-[#64748B]">Şarj noktaları yükleniyor...</p>
          ) : isError ? (
            <QueryError message="Şarj noktaları yüklenemedi." onRetry={refetch} />
          ) : chargePoints.length === 0 ? (
            <p className="text-[#64748B]">Bu firma için şarj noktası bulunamadı.</p>
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
                        Şarj başlatmak için mobil uygulama ile tarayın
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

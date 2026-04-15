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
import { Printer } from 'lucide-react'

interface ChargePoint {
  id: string
  chargePointId: string
  name?: string | null
  tenantId: string
  connectorType?: string | null
  maxPower?: number | null
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

  const selectedTenant = tenants.find((t: { id: string }) => t.id === tenantId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">QR Kodları</h1>
          <p className="text-[#64748B]">
            Şarj noktaları için QR kodları oluşturun ve yazdırın.
          </p>
        </div>
        {chargePoints.length > 0 && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-medium text-white hover:bg-[#1E293B] transition-colors"
          >
            <Printer className="h-4 w-4" />
            Yazdır / PDF
          </button>
        )}
      </div>

      <Card className="print:hidden">
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
        <>
          {/* ── Ekran görünümü ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
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

          {/* ── Yazdırma görünümü (ekranda gizli, print'te görünür) ── */}
          {chargePoints.length > 0 && (
            <div className="hidden print:block">
              <div className="mb-4 text-center">
                <h2 className="text-lg font-bold">
                  {selectedTenant?.name ?? 'Şarj Noktaları'} — QR Kodları
                </h2>
                <p className="text-xs text-gray-500">
                  Kesim çizgilerinden keserek cihaz üzerine yapıştırın
                </p>
              </div>
              <div className="qr-print-grid">
                {chargePoints.map((cp: ChargePoint) => {
                  const qrPayload = JSON.stringify({
                    chargePointId: cp.chargePointId,
                    name: cp.name || cp.chargePointId,
                  })
                  return (
                    <div key={cp.id} className="qr-print-card">
                      <QRCodeSVG value={qrPayload} size={200} level="H" />
                      <div className="mt-2">
                        <p className="text-sm font-bold">{cp.name || cp.chargePointId}</p>
                        <p className="text-xs text-gray-600">
                          {cp.chargePointId} · {cp.connectorType ?? 'Type2'} · {cp.maxPower ?? 22} kW
                        </p>
                      </div>
                      <div className="mt-2 rounded bg-gray-100 px-2 py-1 inline-block">
                        <p className="text-[10px] font-medium text-gray-700">
                          Şarj Modül uygulamasıyla tarayın
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, gatewayApi } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useTenantFilterStore } from '@/store/tenantFilter'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/StatusBadge'
import { Plus, Pencil, Trash2, Play, Square } from 'lucide-react'
import { toast } from 'sonner'

interface GatewayCP {
  chargePointId: string
  connectors?: { status?: string }[]
}

const CHARGING_STATUSES = ['charging', 'suspendedev', 'suspendedevse']
const FAULTED_STATUSES = ['faulted', 'unavailable']

function getPrimaryStatus(gatewayCp: GatewayCP | undefined): string {
  if (!gatewayCp) return 'Çevrimdışı'
  const connectors = gatewayCp.connectors ?? []
  if (connectors.some((c) => CHARGING_STATUSES.includes(c.status?.toLowerCase() ?? ''))) {
    return 'Şarj Oluyor'
  }
  if (connectors.some((c) => FAULTED_STATUSES.includes(c.status?.toLowerCase() ?? ''))) {
    return 'Arızalı'
  }
  return 'Uygun'
}

export interface ChargePointRow {
  id: string
  chargePointId: string
  ocppIdentity?: string | null
  name?: string | null
  connectorType?: string | null
  maxPower?: number | null
  latitude?: string | null
  longitude?: string | null
  isActive?: boolean
}

export function ChargePointsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCp, setEditingCp] = useState<ChargePointRow | null>(null)
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()
  const queryClient = useQueryClient()
  const [actionPendingId, setActionPendingId] = useState<string | null>(null)

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: chargePoints = [], isLoading } = useQuery({
    queryKey: ['charge-points', effectiveTenantId],
    queryFn: () =>
      api
        .get('/charge-points', {
          params: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
        })
        .then((r) => r.data),
  })

  const { data: gatewayStatus } = useQuery({
    queryKey: ['ocpp-gateway-status'],
    queryFn: () => gatewayApi!.get('/charge-points').then((r) => r.data),
    refetchInterval: 10000,
    enabled: !!gatewayApi,
  })

  const gatewayMap = new Map<string, GatewayCP>(
    (gatewayStatus?.chargePoints ?? []).map((cp: GatewayCP) => [
      cp.chargePointId.toLowerCase(),
      cp,
    ])
  )

  const handleStartCharge = async (cpId: string, chargePointId: string) => {
    setActionPendingId(cpId)
    try {
      await api.post('/charge/start', { chargePointId })
      toast.success('Şarj komutu gönderildi')
      queryClient.invalidateQueries({ queryKey: ['ocpp-gateway-status'] })
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.error ?? 'Şarj başlatılamadı')
    } finally {
      setActionPendingId(null)
    }
  }

  const handleStopCharge = async (cpId: string, gatewayChargePointId: string) => {
    setActionPendingId(cpId)
    try {
      if (!gatewayApi) throw new Error('Gateway yapılandırılmamış')
      const { data } = await gatewayApi.get(`/charge-points/${gatewayChargePointId}/transactions`)
      const activeTransaction = (data.transactions ?? []).find((t: { endTime?: string }) => !t.endTime)
      if (!activeTransaction) throw new Error('Aktif işlem bulunamadı')
      await gatewayApi.post('/remote-stop', {
        chargePointId: gatewayChargePointId,
        transactionId: activeTransaction.transactionId,
      })
      toast.success('Durdurma komutu gönderildi')
      queryClient.invalidateQueries({ queryKey: ['ocpp-gateway-status'] })
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error ?? (err as Error).message ?? 'Şarj durdurulamadı'
      toast.error(msg)
    } finally {
      setActionPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Şarj Noktaları</h1>
          <p className="text-[#64748B]">
            Şarj istasyonlarını yönetin ve izleyin
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Şarj Noktası Ekle
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-[#64748B]">Yükleniyor...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {chargePoints.map((cp: ChargePointRow) => {
            const gatewayCp = gatewayMap.get(cp.chargePointId.toLowerCase()) ?? (cp.ocppIdentity ? gatewayMap.get(cp.ocppIdentity.toLowerCase()) : undefined)
            const isOnline = !!gatewayCp
            const connectors = gatewayCp?.connectors ?? []
            const primaryStatus = getPrimaryStatus(gatewayCp)
            return (
              <Card
                key={cp.id}
                className="cursor-pointer transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:ring-offset-2"
                tabIndex={0}
                onClick={() => user?.role !== 'user' && setEditingCp(cp)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    user?.role !== 'user' && setEditingCp(cp)
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cp.chargePointId}</CardTitle>
                    <div className="flex items-center gap-2">
                      {user?.role !== 'user' && (
                        <span className="rounded p-1 text-[#64748B] hover:bg-[#f1f5f9]" title="Düzenle">
                          <Pencil className="h-4 w-4" />
                        </span>
                      )}
                      <StatusBadge status={primaryStatus} />
                    </div>
                  </div>
                  <CardDescription>
                    {cp.name || cp.chargePointId}
                    {cp.connectorType && (
                      <span className="ml-1 text-[#64748B]">({cp.connectorType}{cp.maxPower ? ` ${cp.maxPower}kW` : ''})</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[#64748B]">
                    {isOnline
                      ? `${connectors.length} konnektör · Bağlı`
                      : 'Bağlantı Yok'}
                  </p>
                  {isOnline && gatewayApi && (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      {!connectors.some((c) => CHARGING_STATUSES.includes(c.status?.toLowerCase() ?? '')) &&
                       !connectors.some((c) => c.status?.toLowerCase() === 'preparing') &&
                       connectors.some((c) => c.status?.toLowerCase() === 'available') && (
                        <Button
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => handleStartCharge(cp.id, cp.chargePointId)}
                          disabled={actionPendingId === cp.id}
                        >
                          <Play className="h-3.5 w-3.5" />
                          {actionPendingId === cp.id ? 'Gönderiliyor...' : 'Şarj Başlat'}
                        </Button>
                      )}
                      {connectors.some((c) => CHARGING_STATUSES.includes(c.status?.toLowerCase() ?? '')) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 gap-1.5"
                          onClick={() => handleStopCharge(cp.id, gatewayCp!.chargePointId)}
                          disabled={actionPendingId === cp.id}
                        >
                          <Square className="h-3.5 w-3.5" />
                          {actionPendingId === cp.id ? 'Gönderiliyor...' : 'Şarj Durdur'}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      {showAddModal && (
        <AddChargePointModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['charge-points'] })
            setShowAddModal(false)
          }}
        />
      )}
      {editingCp && (
        <EditChargePointModal
          chargePoint={editingCp}
          onClose={() => setEditingCp(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['charge-points'] })
            setEditingCp(null)
          }}
          onDeleted={() => {
            queryClient.invalidateQueries({ queryKey: ['charge-points'] })
            setEditingCp(null)
          }}
          canDelete={user?.role === 'super_admin'}
        />
      )}
    </div>
  )
}

function AddChargePointModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const { user } = useAuthStore()
  const [tenantId, setTenantId] = useState(user?.tenantId ?? '')
  const [chargePointId, setChargePointId] = useState('')
  const [ocppIdentity, setOcppIdentity] = useState('')
  const [name, setName] = useState('')
  const [connectorType, setConnectorType] = useState<'Type2' | 'CCS' | 'CHAdeMO'>('Type2')
  const [maxPower, setMaxPower] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const queryClient = useQueryClient()

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
    enabled: user?.role === 'super_admin',
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/charge-points', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points'] })
      onSuccess()
      toast.success('Şarj noktası eklendi')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'Şarj noktası eklenemedi')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tid = user?.role === 'super_admin' ? tenantId : user?.tenantId
    if (!tid) { toast.error('Lütfen bir firma seçin'); return }
    const trimmedId = chargePointId.trim()
    if (!trimmedId || trimmedId.length < 3) { toast.error('OCPP ID en az 3 karakter olmalı'); return }
    if (!/^[a-zA-Z0-9_.\-]+$/.test(trimmedId)) { toast.error('OCPP ID: sadece harf, rakam, tire, alt çizgi, nokta'); return }
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('İsim en az 2 karakter olmalı'); return }
    const lat = latitude ? parseFloat(latitude) : undefined
    const lng = longitude ? parseFloat(longitude) : undefined
    if (lat !== undefined && (lat < -90 || lat > 90)) { toast.error('Enlem -90 ile 90 arasında olmalı'); return }
    if (lng !== undefined && (lng < -180 || lng > 180)) { toast.error('Boylam -180 ile 180 arasında olmalı'); return }
    const payload: Record<string, unknown> = {
      tenantId: tid,
      chargePointId: trimmedId,
      name: trimmedName,
      connectorType,
      maxPower: maxPower ? parseInt(maxPower, 10) : undefined,
    }
    if (ocppIdentity.trim()) payload.ocppIdentity = ocppIdentity.trim()
    if (lat !== undefined) payload.latitude = lat
    if (lng !== undefined) payload.longitude = lng
    createMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border-2 border-[#0F172A] bg-white p-6">
        <h2 className="text-lg font-semibold">Şarj Noktası Ekle</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {user?.role === 'super_admin' && (
            <div>
              <label className="block text-sm font-medium">Firma</label>
              <select
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Firma seçin</option>
                {tenants.map((t: { id: string; name: string }) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">OCPP ID</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={chargePointId}
              onChange={(e) => setChargePointId(e.target.value)}
              placeholder="CP001"
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z0-9_.\-]+$"
              title="Sadece harf, rakam, tire, alt çizgi, nokta (min 3 karakter)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Gateway kimliği (opsiyonel)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={ocppIdentity}
              onChange={(e) => setOcppIdentity(e.target.value)}
              placeholder="örn. 2.0.1 veya ocpp2.1"
            />
            <p className="mt-1 text-xs text-[#64748B]">OCPP 2.x farklı WebSocket path ile bağlandığında ayarlayın (örn. 2.0.1). Gateway listesiyle eşleşerek şarj başlatma çalışır.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">İsim</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İstasyon A"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Konnektör Tipi</label>
            <select
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value as 'Type2' | 'CCS' | 'CHAdeMO')}
            >
              <option value="Type2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Maks. Güç (kW, opsiyonel)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              type="number"
              min="1"
              max="1000"
              value={maxPower}
              onChange={(e) => setMaxPower(e.target.value)}
              placeholder="22"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Enlem (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="41.0082"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Boylam (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="28.9784"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditChargePointModal({
  chargePoint,
  onClose,
  onSuccess,
  onDeleted,
  canDelete,
}: {
  chargePoint: ChargePointRow
  onClose: () => void
  onSuccess: () => void
  onDeleted?: () => void
  canDelete?: boolean
}) {
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [name, setName] = useState(chargePoint.name ?? '')
  const [isActive, setIsActive] = useState(chargePoint.isActive ?? true)
  const [ocppIdentity, setOcppIdentity] = useState(chargePoint.ocppIdentity ?? '')
  const [connectorType, setConnectorType] = useState<'Type2' | 'CCS' | 'CHAdeMO'>(
    (chargePoint.connectorType as 'Type2' | 'CCS' | 'CHAdeMO') ?? 'Type2'
  )
  const [maxPower, setMaxPower] = useState(chargePoint.maxPower != null ? String(chargePoint.maxPower) : '')
  const [latitude, setLatitude] = useState(chargePoint.latitude ?? '')
  const [longitude, setLongitude] = useState(chargePoint.longitude ?? '')

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.patch(`/charge-points/${chargePoint.id}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points'] })
      onSuccess()
      toast.success('Şarj noktası güncellendi')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'Şarj noktası güncellenemedi')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/charge-points/${chargePoint.id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points'] })
      setShowDeleteConfirm(false)
      onDeleted?.()
      toast.success('Şarj noktası silindi')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'Şarj noktası silinemedi')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('İsim en az 2 karakter olmalı'); return }
    const lat = latitude.toString().trim() ? parseFloat(latitude.toString()) : NaN
    const lng = longitude.toString().trim() ? parseFloat(longitude.toString()) : NaN
    if (!Number.isNaN(lat) && (lat < -90 || lat > 90)) { toast.error('Enlem -90 ile 90 arasında olmalı'); return }
    if (!Number.isNaN(lng) && (lng < -180 || lng > 180)) { toast.error('Boylam -180 ile 180 arasında olmalı'); return }
    const payload: Record<string, unknown> = {
      name: trimmedName,
      isActive,
      connectorType,
      maxPower: maxPower ? parseInt(maxPower, 10) : undefined,
    }
    if (ocppIdentity.trim()) payload.ocppIdentity = ocppIdentity.trim()
    else payload.ocppIdentity = null
    if (!Number.isNaN(lat)) payload.latitude = lat
    if (!Number.isNaN(lng)) payload.longitude = lng
    updateMutation.mutate(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-lg border-2 border-[#0F172A] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Şarj Noktasını Düzenle</h2>
        <p className="mt-1 text-sm text-[#64748B]">ID: {chargePoint.chargePointId}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">İsim</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="İstasyon A"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-[#0F172A]"
            />
            <label htmlFor="edit-isActive" className="text-sm font-medium">Aktif</label>
          </div>
          <div>
            <label className="block text-sm font-medium">Gateway kimliği (opsiyonel)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={ocppIdentity}
              onChange={(e) => setOcppIdentity(e.target.value)}
              placeholder="örn. 2.0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Konnektör Tipi</label>
            <select
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value as 'Type2' | 'CCS' | 'CHAdeMO')}
            >
              <option value="Type2">Type 2</option>
              <option value="CCS">CCS</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Maks. Güç (kW, opsiyonel)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              type="number"
              min="1"
              max="1000"
              value={maxPower}
              onChange={(e) => setMaxPower(e.target.value)}
              placeholder="22"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Enlem (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="41.0082"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Boylam (opsiyonel)</label>
              <input
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="28.9784"
              />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            {canDelete && (
              <div className="border-t border-[#e2e8f0] pt-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleteMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Şarj Noktasını Sil
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </form>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setShowDeleteConfirm(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-lg border-2 border-red-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-red-700">Şarj Noktasını Sil?</h3>
            <p className="mt-2 text-sm text-[#64748B]">
              <strong>{chargePoint.chargePointId}</strong> şarj noktasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

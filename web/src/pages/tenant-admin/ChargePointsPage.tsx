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
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface GatewayCP {
  chargePointId: string
  connectors?: { status?: string }[]
}

const CHARGING_STATUSES = ['charging', 'suspendedev', 'suspendedevse']
const FAULTED_STATUSES = ['faulted', 'unavailable']

function getPrimaryStatus(gatewayCp: GatewayCP | undefined): string {
  if (!gatewayCp) return 'Offline'
  const connectors = gatewayCp.connectors ?? []
  if (connectors.some((c) => CHARGING_STATUSES.includes(c.status?.toLowerCase() ?? ''))) {
    return 'Charging'
  }
  if (connectors.some((c) => FAULTED_STATUSES.includes(c.status?.toLowerCase() ?? ''))) {
    return 'Faulted'
  }
  return 'Available'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Charge Points</h1>
          <p className="text-[#64748B]">
            Manage and monitor charging stations
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Add Charge Point
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-[#64748B]">Loading...</p>
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
                        <span className="rounded p-1 text-[#64748B] hover:bg-[#f1f5f9]" title="Edit">
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
                      ? `${connectors.length} connector(s) · Connected`
                      : 'Disconnected'}
                  </p>
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
      toast.success('Charge point added')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to add charge point')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tid = user?.role === 'super_admin' ? tenantId : user?.tenantId
    if (!tid) { toast.error('Please select a tenant'); return }
    const trimmedId = chargePointId.trim()
    if (!trimmedId || trimmedId.length < 3) { toast.error('OCPP ID must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_.\-]+$/.test(trimmedId)) { toast.error('OCPP ID: only letters, digits, hyphens, underscores, dots'); return }
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('Name must be at least 2 characters'); return }
    const lat = latitude ? parseFloat(latitude) : undefined
    const lng = longitude ? parseFloat(longitude) : undefined
    if (lat !== undefined && (lat < -90 || lat > 90)) { toast.error('Latitude must be between -90 and 90'); return }
    if (lng !== undefined && (lng < -180 || lng > 180)) { toast.error('Longitude must be between -180 and 180'); return }
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
        <h2 className="text-lg font-semibold">Add Charge Point</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {user?.role === 'super_admin' && (
            <div>
              <label className="block text-sm font-medium">Tenant</label>
              <select
                className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Select tenant</option>
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
              title="Letters, digits, hyphens, underscores, dots only (min 3 chars)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Gateway identity (optional)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={ocppIdentity}
              onChange={(e) => setOcppIdentity(e.target.value)}
              placeholder="e.g. 2.0.1 or ocpp2.1 — from GET /charge-points when 2.x connects"
            />
            <p className="mt-1 text-xs text-[#64748B]">Set when OCPP 2.x connects with a different WebSocket path (e.g. 2.0.1). Matches gateway list so start charge works.</p>
          </div>
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Station A"
              required
              minLength={2}
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Connector Type</label>
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
            <label className="block text-sm font-medium">Max Power (kW, optional)</label>
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
              <label className="block text-sm font-medium">Latitude (optional)</label>
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
              <label className="block text-sm font-medium">Longitude (optional)</label>
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
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add'}
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
      toast.success('Charge point updated')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to update charge point')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/charge-points/${chargePoint.id}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charge-points'] })
      setShowDeleteConfirm(false)
      onDeleted?.()
      toast.success('Charge point deleted')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to delete charge point')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('Name must be at least 2 characters'); return }
    const lat = latitude.toString().trim() ? parseFloat(latitude.toString()) : NaN
    const lng = longitude.toString().trim() ? parseFloat(longitude.toString()) : NaN
    if (!Number.isNaN(lat) && (lat < -90 || lat > 90)) { toast.error('Latitude must be between -90 and 90'); return }
    if (!Number.isNaN(lng) && (lng < -180 || lng > 180)) { toast.error('Longitude must be between -180 and 180'); return }
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
        <h2 className="text-lg font-semibold">Edit Charge Point</h2>
        <p className="mt-1 text-sm text-[#64748B]">ID: {chargePoint.chargePointId}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Station A"
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
            <label htmlFor="edit-isActive" className="text-sm font-medium">Active</label>
          </div>
          <div>
            <label className="block text-sm font-medium">Gateway identity (optional)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={ocppIdentity}
              onChange={(e) => setOcppIdentity(e.target.value)}
              placeholder="e.g. 2.0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Connector Type</label>
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
            <label className="block text-sm font-medium">Max Power (kW, optional)</label>
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
              <label className="block text-sm font-medium">Latitude (optional)</label>
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
              <label className="block text-sm font-medium">Longitude (optional)</label>
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
                  Delete Charge Point
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
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
            <h3 className="text-lg font-semibold text-red-700">Delete Charge Point?</h3>
            <p className="mt-2 text-sm text-[#64748B]">
              Are you sure you want to delete <strong>{chargePoint.chargePointId}</strong>? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

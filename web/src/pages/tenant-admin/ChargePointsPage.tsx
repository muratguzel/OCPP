import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
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
import { Plus } from 'lucide-react'

const GATEWAY_URL = import.meta.env.VITE_OCPP_GATEWAY_URL || 'http://localhost:3000'

export function ChargePointsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
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
    queryFn: () =>
      fetch(`${GATEWAY_URL}/charge-points`).then((r) => r.json()),
    refetchInterval: 10000,
  })

  interface GatewayCP {
    chargePointId: string
    connectors?: { status: string }[]
  }
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
        {user?.role !== 'user' && (
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
          {chargePoints.map((cp: { id: string; chargePointId: string; name?: string; connectorType?: string; maxPower?: number }) => {
            const gatewayCp = gatewayMap.get(cp.chargePointId.toLowerCase())
            const isOnline = !!gatewayCp
            const connectors: { status: string }[] = gatewayCp?.connectors ?? []
            const primaryStatus = connectors.some((c) =>
              ['Charging', 'SuspendedEV', 'SuspendedEVSE'].includes(c.status)
            )
              ? 'Charging'
              : connectors.some((c) =>
                  ['Faulted', 'Unavailable'].includes(c.status)
                )
                ? 'Faulted'
                : isOnline
                  ? 'Available'
                  : 'Offline'
            return (
              <Card key={cp.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cp.chargePointId}</CardTitle>
                    <StatusBadge status={primaryStatus} />
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
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const tid = user?.role === 'super_admin' ? tenantId : user?.tenantId
    if (tid && chargePointId.trim()) {
      const payload: Record<string, unknown> = {
        tenantId: tid,
        chargePointId: chargePointId.trim(),
        name: name.trim() || undefined,
        connectorType,
        maxPower: maxPower ? parseInt(maxPower, 10) : undefined,
      }
      if (latitude) payload.latitude = parseFloat(latitude)
      if (longitude) payload.longitude = parseFloat(longitude)
      createMutation.mutate(payload)
    }
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Name (optional)</label>
            <input
              className="mt-1 w-full rounded border-2 border-[#0F172A] px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Station A"
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

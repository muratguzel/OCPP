import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QueryError } from '@/components/QueryError'
import { toast } from 'sonner'

export function PricingPage() {
  const { user } = useAuthStore()
  const { selectedTenantId, setSelectedTenantId } = useTenantFilterStore()
  const queryClient = useQueryClient()

  const effectiveTenantId =
    user?.role === 'super_admin' ? selectedTenantId : user?.tenantId

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
    enabled: user?.role === 'super_admin',
  })

  const { data: tenant, isLoading, isError, refetch } = useQuery({
    queryKey: ['tenant', effectiveTenantId],
    queryFn: () =>
      api.get(`/tenants/${effectiveTenantId}`).then((r) => r.data),
    enabled: !!effectiveTenantId,
  })

  const [pricePerKwh, setPricePerKwh] = useState('')
  const [vatRate, setVatRate] = useState('')

  useEffect(() => {
    if (tenant) {
      setPricePerKwh(tenant.pricePerKwh ?? '')
      setVatRate(tenant.vatRate ?? '0')
    }
  }, [tenant, effectiveTenantId])

  const updateMutation = useMutation({
    mutationFn: (payload: { pricePerKwh?: number; vatRate?: number }) =>
      api.patch(`/tenants/${effectiveTenantId}`, payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', effectiveTenantId] })
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      toast.success('Pricing saved')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to save pricing')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(pricePerKwh)
    const vat = parseFloat(vatRate)
    if (Number.isNaN(price) || price < 0) { toast.error('Please enter a valid price (min 0)'); return }
    if (price > 9999) { toast.error('Price cannot exceed 9999'); return }
    if (Number.isNaN(vat) || vat < 0 || vat > 100) { toast.error('VAT rate must be between 0 and 100'); return }
    updateMutation.mutate({ pricePerKwh: price, vatRate: vat })
  }

  if (user?.role === 'admin' && !user?.tenantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Pricing</h1>
        <p className="text-[#64748B]">You must belong to a tenant to manage pricing.</p>
      </div>
    )
  }

  if (!effectiveTenantId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Pricing</h1>
        {user?.role === 'super_admin' ? (
          <p className="text-[#64748B]">Select a tenant from the filter to manage pricing.</p>
        ) : (
          <p className="text-[#64748B]">Select a tenant to manage pricing.</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Pricing</h1>
        <p className="text-[#64748B]">
          Set kWh price and VAT rate for your charge points.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tenant Pricing</CardTitle>
          <CardDescription>
            {user?.role === 'super_admin'
              ? 'Select tenant above and set price per kWh and VAT rate. VAT 0% if not selling electricity.'
              : 'Set price per kWh and VAT rate for all charge points in your organization.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user?.role === 'super_admin' && (
            <div className="mb-4">
              <Label>Tenant</Label>
              <select
                className="mt-1 w-full max-w-xs rounded border-2 border-[#0F172A] px-3 py-2"
                value={effectiveTenantId ?? ''}
                onChange={(e) => setSelectedTenantId(e.target.value || null)}
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
          {isLoading ? (
            <p className="text-[#64748B]">Loading...</p>
          ) : isError ? (
            <QueryError message="Failed to load pricing data." onRetry={refetch} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerKwh">Price per kWh (₺)</Label>
                <Input
                  id="pricePerKwh"
                  type="number"
                  step="0.01"
                  min="0"
                  max="9999"
                  value={pricePerKwh}
                  onChange={(e) => setPricePerKwh(e.target.value)}
                  placeholder="12.50"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  placeholder="18"
                  required
                />
                <p className="text-xs text-[#64748B]">
                  Use 0% if not selling electricity; set your rate if selling.
                </p>
              </div>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

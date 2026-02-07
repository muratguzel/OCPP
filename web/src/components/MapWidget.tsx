import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/auth'
import { useTenantFilterStore } from '@/store/tenantFilter'

interface ChargePointWithLocation {
  id: string
  chargePointId: string
  name?: string | null
  latitude?: string | null
  longitude?: string | null
}

export function MapWidget() {
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: chargePoints = [] } = useQuery({
    queryKey: ['charge-points-for-map', effectiveTenantId],
    queryFn: () =>
      api
        .get<ChargePointWithLocation[]>('/charge-points', {
          params: effectiveTenantId ? { tenantId: effectiveTenantId } : {},
        })
        .then((r) => r.data),
    enabled: user?.role === 'super_admin',
  })

  const pointsWithCoords = (chargePoints as ChargePointWithLocation[]).filter(
    (cp) => cp.latitude && cp.longitude && parseFloat(cp.latitude) && parseFloat(cp.longitude)
  )

  useEffect(() => {
    if (!mapRef.current || pointsWithCoords.length === 0) return

    const initMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }

      const center = pointsWithCoords.length > 0
        ? [
            pointsWithCoords.reduce((sum, p) => sum + parseFloat(p.latitude!), 0) / pointsWithCoords.length,
            pointsWithCoords.reduce((sum, p) => sum + parseFloat(p.longitude!), 0) / pointsWithCoords.length,
          ] as [number, number]
        : [41.0082, 28.9784] as [number, number]

      const el = mapRef.current
      if (!el) return
      const map = L.map(el).setView(center, 10)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map)

      pointsWithCoords.forEach((cp) => {
        L.marker([parseFloat(cp.latitude!), parseFloat(cp.longitude!)])
          .addTo(map)
          .bindPopup(cp.name || cp.chargePointId)
      })

      mapInstanceRef.current = map
    }

    initMap()
    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [pointsWithCoords.length])

  if (user?.role !== 'super_admin') return null

  return (
    <div className="rounded-lg border border-[#0F172A] overflow-hidden bg-white">
      <div className="p-4 border-b border-[#0F172A]">
        <h3 className="font-semibold">Charge Point Locations</h3>
        <p className="text-sm text-[#64748B]">
          {pointsWithCoords.length > 0
            ? `${pointsWithCoords.length} station(s) with coordinates`
            : 'Add latitude/longitude to charge points to see them on the map'}
        </p>
      </div>
      <div
        ref={mapRef}
        className="h-[300px] w-full"
        style={{ minHeight: 300 }}
      />
    </div>
  )
}

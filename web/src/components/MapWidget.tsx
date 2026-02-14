import { useEffect, useMemo, useRef } from 'react'
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

  const pointsWithCoords = useMemo(
    () => (chargePoints as ChargePointWithLocation[]).filter(
      (cp) => cp.latitude && cp.longitude && parseFloat(cp.latitude) && parseFloat(cp.longitude)
    ),
    [chargePoints]
  )

  const coordsKey = useMemo(
    () => pointsWithCoords.map((p) => `${p.chargePointId}:${p.latitude},${p.longitude}`).join('|'),
    [pointsWithCoords]
  )

  useEffect(() => {
    if (!mapRef.current || pointsWithCoords.length === 0) return

    const initMap = async () => {
      const L = await import('leaflet')
      await import('leaflet/dist/leaflet.css')

      // Vite/bundled build'de Leaflet varsayılan pin resimleri yüklenmez; CDN ile açık icon kullan.
      const markerIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })

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
        L.marker([parseFloat(cp.latitude!), parseFloat(cp.longitude!)], { icon: markerIcon })
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
  }, [coordsKey])

  if (user?.role !== 'super_admin') return null

  return (
    <div className="rounded-lg border border-[#0F172A] overflow-hidden bg-white">
      <div className="p-4 border-b border-[#0F172A]">
        <h3 className="font-semibold">Şarj Noktası Konumları</h3>
        <p className="text-sm text-[#64748B]">
          {pointsWithCoords.length > 0
            ? `Koordinatlı ${pointsWithCoords.length} istasyon`
            : 'Haritada görmek için şarj noktalarına enlem/boylam ekleyin'}
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

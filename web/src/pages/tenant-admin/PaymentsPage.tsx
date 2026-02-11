import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Search, FileDown } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type UserOption = {
  id: string
  name: string
  email: string
  numaraTaj: string | null
  isActive?: boolean
}

export function PaymentsPage() {
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()

  const today = new Date().toISOString().slice(0, 10)
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [startDate, setStartDate] = useState(lastWeek)
  const [endDate, setEndDate] = useState(today)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedNumaraTaj, setSelectedNumaraTaj] = useState('')
  const [lastSearch, setLastSearch] = useState<{
    startDate: string
    endDate: string
    userId: string
    numaraTaj: string
    tenantId: string | undefined
  } | null>(null)

  const effectiveTenantId =
    user?.role === 'super_admin' ? selectedTenantId ?? undefined : user?.tenantId

  const { data: users = [] } = useQuery({
    queryKey: ['users', effectiveTenantId],
    queryFn: () =>
      api
        .get<UserOption[]>(
          '/users',
          { params: effectiveTenantId ? { tenantId: effectiveTenantId } : {} }
        )
        .then((r) => r.data),
  })

  const userOptions = useMemo(
    () => users.filter((u) => u.isActive !== false) as UserOption[],
    [users]
  )

  const numaraTajOptions = useMemo(() => {
    const set = new Set<string>()
    userOptions.forEach((u) => {
      if (u.numaraTaj && u.numaraTaj.trim()) set.add(u.numaraTaj.trim())
    })
    return Array.from(set).sort()
  }, [userOptions])

  const usersByNumaraTaj = useMemo(() => {
    const map = new Map<string, UserOption[]>()
    userOptions.forEach((u) => {
      if (!u.numaraTaj || !u.numaraTaj.trim()) return
      const key = u.numaraTaj.trim()
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(u as UserOption)
    })
    return map
  }, [userOptions])

  const handleUserChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const id = e.target.value
      setSelectedUserId(id)
      const u = userOptions.find((x) => x.id === id)
      setSelectedNumaraTaj(u?.numaraTaj?.trim() ?? '')
    },
    [userOptions]
  )

  const handleNumaraTajChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      setSelectedNumaraTaj(value)
      const list = value ? usersByNumaraTaj.get(value) ?? [] : []
      if (list.length === 1) {
        setSelectedUserId(list[0].id)
      } else {
        setSelectedUserId('')
      }
    },
    [usersByNumaraTaj]
  )

  const {
    data: summary,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['payments-summary', lastSearch],
    queryFn: () => {
      if (!lastSearch) return Promise.reject(new Error('No search'))
      const p = new URLSearchParams({
        startDate: lastSearch.startDate,
        endDate: lastSearch.endDate,
      })
      if (lastSearch.tenantId) p.set('tenantId', lastSearch.tenantId)
      if (lastSearch.userId) p.set('userId', lastSearch.userId)
      if (lastSearch.numaraTaj) p.set('numaraTaj', lastSearch.numaraTaj)
      return api
        .get<{
          totalCost: number
          totalKwh: number
          sessionCount: number
          breakdown: {
            userId?: string
            numaraTaj?: string
            name?: string
            totalCost: number
            totalKwh: number
            sessionCount: number
          }[]
        }>(`/payments/summary?${p}`)
        .then((r) => r.data)
    },
    enabled: !!lastSearch,
  })

  const handleSearch = () => {
    setLastSearch({
      startDate,
      endDate,
      userId: selectedUserId,
      numaraTaj: selectedNumaraTaj,
      tenantId: effectiveTenantId ?? undefined,
    })
  }

  const exportParams = lastSearch
    ? (() => {
        const p = new URLSearchParams({
          startDate: lastSearch.startDate,
          endDate: lastSearch.endDate,
        })
        if (lastSearch.tenantId) p.set('tenantId', lastSearch.tenantId)
        if (lastSearch.userId) p.set('userId', lastSearch.userId)
        if (lastSearch.numaraTaj) p.set('numaraTaj', lastSearch.numaraTaj)
        return p
      })()
    : null

  const handlePrintReceipt = () => {
    if (!exportParams) return
    const url = `${API_BASE}/payments/export?${exportParams}`
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('download', `odeme-fisi-${lastSearch!.startDate}-${lastSearch!.endDate}.pdf`)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener')
    fetch(url, { headers: getAuthHeaders() })
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob)
        a.href = blobUrl
        a.click()
        URL.revokeObjectURL(blobUrl)
      })
      .catch(() => {
        window.open(url, '_blank')
      })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Payments</h1>
        <p className="text-[#64748B]">
          Filter and search payment summary, then print receipt as PDF
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter by date range, user (Adı Soyadı / email), or numarataj. Admin sees only their
            tenant’s users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">Adı Soyadı (email)</Label>
              <select
                id="user"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedUserId}
                onChange={handleUserChange}
              >
                <option value="">Tümü</option>
                {userOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="numaraTaj">Numarataj</Label>
              <select
                id="numaraTaj"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedNumaraTaj}
                onChange={handleNumaraTajChange}
              >
                <option value="">Tümü</option>
                {numaraTajOptions.map((nt) => (
                  <option key={nt} value={nt}>
                    {nt}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                ARA
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {lastSearch && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Total cost, kWh, and session count for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-[#64748B]">Loading...</p>
            ) : isError ? (
              <p className="text-red-600">
                Arama başarısız:{' '}
                {(error as { response?: { data?: { error?: string; message?: string } } })
                  ?.response?.data?.error ||
                  (error as { response?: { data?: { message?: string } } })?.response?.data
                    ?.message ||
                  (error as Error)?.message ||
                  'Bilinmeyen hata'}
              </p>
            ) : summary ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm text-[#64748B]">Total Cost</p>
                    <p className="text-2xl font-bold">₺{summary.totalCost.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Total kWh</p>
                    <p className="text-2xl font-bold">{summary.totalKwh.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[#64748B]">Sessions</p>
                    <p className="text-2xl font-bold">{summary.sessionCount}</p>
                  </div>
                </div>
                {summary.breakdown.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold">By User / NumaraTaj</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Numarataj</TableHead>
                          <TableHead>kWh</TableHead>
                          <TableHead>Sessions</TableHead>
                          <TableHead>Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.breakdown.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell>{row.name ?? '-'}</TableCell>
                            <TableCell>{row.numaraTaj ?? '-'}</TableCell>
                            <TableCell>{row.totalKwh.toFixed(2)}</TableCell>
                            <TableCell>{row.sessionCount}</TableCell>
                            <TableCell className="font-semibold">
                              ₺{row.totalCost.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="pt-2">
                  <Button onClick={handlePrintReceipt} variant="outline">
                    <FileDown className="mr-2 h-4 w-4" />
                    Fiş Bastır
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-[#64748B]">No data for the selected filters.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!lastSearch && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-[#64748B]">Filtreleri seçip ARA butonuna tıklayın.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

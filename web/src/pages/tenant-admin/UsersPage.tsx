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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/StatusBadge'
import { QueryError } from '@/components/QueryError'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

export function UsersPage() {
  const [open, setOpen] = useState(false)
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()
  const queryClient = useQueryClient()

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['users', effectiveTenantId],
    queryFn: () =>
      api
        .get('/users', { params: effectiveTenantId ? { tenantId: effectiveTenantId } : {} })
        .then((r) => r.data),
  })

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
    enabled: user?.role === 'super_admin',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Kullanıcılar</h1>
          <p className="text-[#64748B]">Firmaya ait kullanıcıları yönetin</p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Kullanıcı Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AddUserForm
                tenants={tenants}
                isSuperAdmin={user?.role === 'super_admin'}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['users'] })
                  setOpen(false)
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
          <CardDescription>Organizasyonunuzdaki tüm kullanıcılar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-[#64748B]">Yükleniyor...</p>
          ) : isError ? (
            <QueryError message="Kullanıcılar yüklenemedi." onRetry={refetch} />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-[#64748B]">Henüz kullanıcı yok.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  {user?.role === 'super_admin' && <TableHead>Firma</TableHead>}
                  <TableHead>Numarataj</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Oluşturulma</TableHead>
                  {(user?.role === 'super_admin' || user?.role === 'admin') && (
                    <TableHead className="text-right">İşlemler</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.filter(
                  (u: { isActive: boolean }) => u.isActive
                ).map(
                  (u: {
                    id: string
                    name: string
                    email: string
                    tenantId?: string | null
                    numaraTaj?: string | null
                    phone?: string | null
                    role: string
                    isActive: boolean
                    createdAt: string
                  }) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      {user?.role === 'super_admin' && (
                        <TableCell>
                          {tenants.find((t: { id: string }) => t.id === u.tenantId)?.name ?? '-'}
                        </TableCell>
                      )}
                      <TableCell>{u.numaraTaj ?? '-'}</TableCell>
                      <TableCell>{u.phone ?? '-'}</TableCell>
                      <TableCell>
                        {u.role === 'super_admin'
                          ? 'Sistem Yöneticisi'
                          : u.role === 'admin'
                            ? 'Yönetici'
                            : 'Kullanıcı'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={u.isActive ? 'active' : 'suspended'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      {(user?.role === 'super_admin' || user?.role === 'admin') && (
                        <TableCell className="text-right flex gap-1 justify-end">
                          <UserEditButton
                            targetUser={u}
                            callerRole={user?.role ?? 'user'}
                            onUpdated={() =>
                              queryClient.invalidateQueries({ queryKey: ['users'] })
                            }
                          />
                          <UserDeactivateButton
                            targetUser={u}
                            currentUserId={user?.id}
                            callerRole={user?.role ?? 'user'}
                            onDeactivated={() =>
                              queryClient.invalidateQueries({ queryKey: ['users'] })
                            }
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function UserDeactivateButton({
  targetUser,
  currentUserId,
  callerRole,
  onDeactivated,
}: {
  targetUser: { id: string; name: string; email: string; role: string }
  currentUserId: string | undefined
  callerRole: string
  onDeactivated: () => void
}) {
  const [open, setOpen] = useState(false)
  const deactivateMutation = useMutation({
    mutationFn: () => {
      if (callerRole === 'super_admin') {
        return api.delete(`/users/${targetUser.id}`).then((r) => r.data)
      }
      return api.patch(`/users/${targetUser.id}`, { isActive: false }).then((r) => r.data)
    },
    onSuccess: () => {
      onDeactivated()
      setOpen(false)
      toast.success('Kullanıcı devre dışı bırakıldı')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'İşlem başarısız')
    },
  })

  const isSelf = currentUserId === targetUser.id
  const isSuperAdminTarget = targetUser.role === 'super_admin'
  const isAdminTarget = targetUser.role === 'admin' && callerRole === 'admin'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
        disabled={isSelf || isSuperAdminTarget || isAdminTarget}
        title={
          isSelf
            ? 'Kendinizi devre dışı bırakamazsınız'
            : isSuperAdminTarget
              ? 'Super admin devre dışı bırakılamaz'
              : isAdminTarget
                ? 'Admin kullanıcıyı devre dışı bırakamazsınız'
                : 'Devre dışı bırak'
        }
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı devre dışı bırak</DialogTitle>
          <DialogDescription>
            <strong>{targetUser.name}</strong> ({targetUser.email}) kullanıcısını devre dışı bırakmak üzeresiniz. Hesap pasif hale gelecek ve listeden kaldırılacaktır. Emin misiniz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={() => deactivateMutation.mutate(undefined)}
            disabled={deactivateMutation.isPending}
          >
            {deactivateMutation.isPending ? 'İşleniyor...' : 'Devre Dışı Bırak'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UserEditButton({
  targetUser,
  callerRole,
  onUpdated,
}: {
  targetUser: {
    id: string
    name: string
    email: string
    numaraTaj?: string | null
    phone?: string | null
    role: string
  }
  callerRole: string
  onUpdated: () => void
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(targetUser.name)
  const [numaraTaj, setNumaraTaj] = useState(targetUser.numaraTaj ?? '')
  const [phone, setPhone] = useState(targetUser.phone ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(targetUser.role)

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.patch(`/users/${targetUser.id}`, payload).then((r) => r.data),
    onSuccess: () => {
      onUpdated()
      setOpen(false)
      toast.success('Kullanıcı güncellendi')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'Güncelleme başarısız')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const trimmedNumaraTaj = numaraTaj.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('İsim en az 2 karakter olmalı'); return }
    if (/^\d+$/.test(trimmedName)) { toast.error('İsim sadece rakamlardan oluşamaz'); return }
    if (trimmedNumaraTaj && !/^[0-9]+$/.test(trimmedNumaraTaj)) { toast.error('Numarataj sadece rakam içermeli'); return }
    if (trimmedNumaraTaj && trimmedNumaraTaj.length < 3) { toast.error('Numarataj en az 3 haneli olmalı'); return }
    if (trimmedPhone && !/^\+?[0-9]{10,15}$/.test(trimmedPhone)) { toast.error('Telefon 10-15 haneli olmalı'); return }
    if (password && password.length < 8) { toast.error('Şifre en az 8 karakter olmalı'); return }
    const payload: Record<string, unknown> = { name: trimmedName }
    if (trimmedNumaraTaj) payload.numaraTaj = trimmedNumaraTaj
    if (trimmedPhone) payload.phone = trimmedPhone
    if (password) payload.password = password
    if (callerRole === 'super_admin' && role !== targetUser.role) payload.role = role
    updateMutation.mutate(payload)
  }

  const handleOpen = (val: boolean) => {
    if (val) {
      setName(targetUser.name)
      setNumaraTaj(targetUser.numaraTaj ?? '')
      setPhone(targetUser.phone ?? '')
      setPassword('')
      setRole(targetUser.role)
    }
    setOpen(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <Button
        size="sm"
        variant="ghost"
        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={() => handleOpen(true)}
        title="Düzenle"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
            <DialogDescription>{targetUser.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">İsim</Label>
              <Input
                id="editName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">E-posta</Label>
              <Input
                id="editEmail"
                type="email"
                value={targetUser.email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNumaraTaj">Numarataj</Label>
              <Input
                id="editNumaraTaj"
                value={numaraTaj}
                onChange={(e) => setNumaraTaj(e.target.value.replace(/[^0-9]/g, ''))}
                minLength={3}
                maxLength={20}
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Telefon</Label>
              <Input
                id="editPhone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+905551234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPassword">Yeni Şifre</Label>
              <Input
                id="editPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Değiştirmek istemiyorsanız boş bırakın"
                minLength={8}
              />
              <p className="text-xs text-[#64748B]">Boş bırakılırsa mevcut şifre korunur</p>
            </div>
            {callerRole === 'super_admin' && targetUser.role !== 'super_admin' && (
              <div className="space-y-2">
                <Label htmlFor="editRole">Rol</Label>
                <select
                  id="editRole"
                  className="w-full rounded border-2 border-[#0F172A] px-3 py-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Kullanıcı</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddUserForm({
  tenants,
  isSuperAdmin,
  onSuccess,
}: {
  tenants: { id: string; name: string }[]
  isSuperAdmin: boolean
  onSuccess: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [numaraTaj, setNumaraTaj] = useState('')
  const [phone, setPhone] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/users', payload).then((r) => r.data),
    onSuccess: () => {
      onSuccess()
      toast.success('Kullanıcı oluşturuldu')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.error ?? (err as any)?.response?.data?.message ?? 'Kullanıcı oluşturulamadı')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const trimmedNumaraTaj = numaraTaj.trim()
    if (!trimmedName || trimmedName.length < 2) { toast.error('İsim en az 2 karakter olmalı'); return }
    if (/^\d+$/.test(trimmedName)) { toast.error('İsim sadece rakamlardan oluşamaz'); return }
    if (!email.trim()) { toast.error('E-posta zorunludur'); return }
    if (password.length < 8) { toast.error('Şifre en az 8 karakter olmalı'); return }
    if (!trimmedNumaraTaj || !/^[0-9]+$/.test(trimmedNumaraTaj)) { toast.error('Numarataj sadece rakam içermeli'); return }
    if (trimmedNumaraTaj.length < 3) { toast.error('Numarataj en az 3 haneli olmalı'); return }
    if (!trimmedPhone || !/^\+?[0-9]{10,15}$/.test(trimmedPhone)) { toast.error('Telefon 10-15 haneli olmalı, isteğe bağlı + ile başlayabilir'); return }
    const payload: Record<string, unknown> = {
      email: email.trim(),
      password,
      name: trimmedName,
      numaraTaj: trimmedNumaraTaj,
      phone: trimmedPhone,
      role,
    }
    if (isSuperAdmin && tenantId) payload.tenantId = tenantId
    createMutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Kullanıcı Ekle</DialogTitle>
        <DialogDescription>Yeni bir kullanıcı hesabı oluşturun.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {isSuperAdmin && (
          <>
            <div className="space-y-2">
              <Label>Firma</Label>
              <select
                className="w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Firma seçin</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <select
                className="w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              >
                <option value="user">Kullanıcı</option>
                <option value="admin">Yönetici</option>
              </select>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="numaraTaj">Numarataj</Label>
          <Input
            id="numaraTaj"
            value={numaraTaj}
            onChange={(e) => setNumaraTaj(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="örn. 123456"
            required
            minLength={3}
            maxLength={20}
            pattern="^[0-9]+$"
            title="Sadece rakam girilmeli"
            inputMode="numeric"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="örn. +905551234567"
            required
            pattern="^\+?[0-9]{10,15}$"
            title="10-15 haneli telefon numarası, isteğe bağlı + ile başlayabilir"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Ad Soyad</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
            pattern="^(?!^\d+$).{2,}$"
            title="İsim sadece rakamlardan oluşamaz"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <p className="text-xs text-[#64748B]">En az 8 karakter</p>
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Oluşturuluyor...' : 'Oluştur'}
        </Button>
      </DialogFooter>
    </form>
  )
}

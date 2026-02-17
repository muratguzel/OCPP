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
import { Plus, Trash2 } from 'lucide-react'
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Users</h1>
          <p className="text-[#64748B]">Manage end-users for your tenant</p>
        </div>
        {(user?.role === 'super_admin' || user?.role === 'admin') && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Add User
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
          <CardTitle>Users List</CardTitle>
          <CardDescription>All users in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-[#64748B]">Loading...</p>
          ) : isError ? (
            <QueryError message="Failed to load users." onRetry={refetch} />
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-[#64748B]">No users yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Numarataj</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {user?.role === 'super_admin' && (
                    <TableHead className="text-right">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(
                  (u: {
                    id: string
                    name: string
                    email: string
                    numaraTaj?: string | null
                    phone?: string | null
                    role: string
                    isActive: boolean
                    createdAt: string
                  }) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.numaraTaj ?? '-'}</TableCell>
                      <TableCell>{u.phone ?? '-'}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={u.isActive ? 'available' : 'offline'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      {user?.role === 'super_admin' && (
                        <TableCell className="text-right">
                          <UserDeleteButton
                            user={u}
                            currentUserId={user?.id}
                            onDeleted={() =>
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

function UserDeleteButton({
  user,
  currentUserId,
  onDeleted,
}: {
  user: { id: string; name: string; email: string; role: string }
  currentUserId: string | undefined
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${user.id}`).then((r) => r.data),
    onSuccess: () => {
      onDeleted()
      setOpen(false)
      toast.success('User deleted')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to delete user')
    },
  })

  const isSelf = currentUserId === user.id
  const isSuperAdminTarget = user.role === 'super_admin'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={() => setOpen(true)}
        disabled={isSelf || isSuperAdminTarget}
        title={
          isSelf
            ? 'Kendinizi silemezsiniz'
            : isSuperAdminTarget
              ? 'Super admin silinemez'
              : 'Kullanıcıyı sil'
        }
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kullanıcıyı sil</DialogTitle>
          <DialogDescription>
            <strong>{user.name}</strong> ({user.email}) kullanıcısını devre dışı bırakmak üzeresiniz. Hesap pasif hale gelecektir. Emin misiniz?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate(undefined)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
          </Button>
        </DialogFooter>
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
      toast.success('User created')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to create user')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      email,
      password,
      name,
      numaraTaj: numaraTaj.trim(),
      phone: phone.trim(),
      role,
    }
    if (isSuperAdmin && tenantId) payload.tenantId = tenantId
    createMutation.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add User</DialogTitle>
        <DialogDescription>Create a new user account.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {isSuperAdmin && (
          <>
            <div className="space-y-2">
              <Label>Tenant</Label>
              <select
                className="w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                required
              >
                <option value="">Select tenant</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className="w-full rounded border-2 border-[#0F172A] px-3 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="numaraTaj">Numarataj</Label>
          <Input
            id="numaraTaj"
            value={numaraTaj}
            onChange={(e) => setNumaraTaj(e.target.value)}
            placeholder="e.g. 123456"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +905551234567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  )
}

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
import { Plus } from 'lucide-react'

export function UsersPage() {
  const [open, setOpen] = useState(false)
  const { user } = useAuthStore()
  const { selectedTenantId } = useTenantFilterStore()
  const queryClient = useQueryClient()

  const effectiveTenantId = user?.role === 'super_admin' ? selectedTenantId ?? undefined : undefined

  const { data: users = [], isLoading } = useQuery({
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(
                  (u: {
                    id: string
                    name: string
                    email: string
                    role: string
                    isActive: boolean
                    createdAt: string
                  }) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={u.isActive ? 'available' : 'offline'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
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
  const [tenantId, setTenantId] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.post('/users', payload).then((r) => r.data),
    onSuccess,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Record<string, unknown> = {
      email,
      password,
      name,
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

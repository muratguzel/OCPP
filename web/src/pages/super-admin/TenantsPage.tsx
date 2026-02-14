import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
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
import { Plus, Pencil, Ban, CheckCircle, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { QueryError } from '@/components/QueryError'
import { toast } from 'sonner'

export function TenantsPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data: tenants = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get('/tenants').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      api.post('/tenants', payload).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setOpen(false)
      setName('')
      toast.success('Tenant created')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to create tenant')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) createMutation.mutate({ name: name.trim() })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Tenants</h1>
          <p className="text-[#64748B]">Manage tenant organizations</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Tenant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Add Tenant</DialogTitle>
                <DialogDescription>Create a new tenant organization.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tenant-name">Name</Label>
                  <Input
                    id="tenant-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Şarj"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tenants List</CardTitle>
          <CardDescription>All registered tenant organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-[#64748B]">Loading...</p>
          ) : isError ? (
            <QueryError message="Failed to load tenants." onRetry={refetch} />
          ) : tenants.length === 0 ? (
            <p className="py-8 text-center text-[#64748B]">No tenants yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((t: { id: string; name: string; isSuspended?: boolean; createdAt: string }) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={t.isSuspended ? 'offline' : 'available'} />
                    </TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <TenantActions tenant={t} onUpdate={() => queryClient.invalidateQueries({ queryKey: ['tenants'] })} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TenantActions({
  tenant,
  onUpdate,
}: {
  tenant: { id: string; name: string; isSuspended?: boolean }
  onUpdate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(tenant.name)

  const updateMutation = useMutation({
    mutationFn: (payload: { name?: string; isSuspended?: boolean }) =>
      api.patch(`/tenants/${tenant.id}`, payload).then((r) => r.data),
    onSuccess: () => {
      onUpdate()
      setEditing(false)
      toast.success('Tenant updated')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to update tenant')
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/tenants/${tenant.id}`).then((r) => r.data),
    onSuccess: () => {
      onUpdate()
      setDeleteOpen(false)
      toast.success('Tenant deleted')
    },
    onError: (err: unknown) => {
      toast.error((err as any)?.response?.data?.message ?? 'Failed to delete tenant')
    },
  })

  return (
    <div className="flex items-center justify-end gap-1">
      {editing ? (
        <>
          <input
            className="mr-2 w-32 rounded border-2 border-[#0F172A] px-2 py-1 text-sm"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            minLength={2}
            maxLength={100}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const trimmed = editName.trim()
              if (trimmed.length < 2) return
              updateMutation.mutate({ name: trimmed })
            }}
            disabled={updateMutation.isPending}
          >
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              updateMutation.mutate({ isSuspended: !tenant.isSuspended })
            }
            disabled={updateMutation.isPending}
          >
            {tenant.isSuspended ? (
              <CheckCircle className="h-4 w-4 text-[#10B981]" />
            ) : (
              <Ban className="h-4 w-4 text-[#F59E0B]" />
            )}
          </Button>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tenant'ı sil</DialogTitle>
                <DialogDescription>
                  <strong>{tenant.name}</strong> tenant'ını silmek üzeresiniz. Bu işlem geri alınamaz ve bu tenant'a bağlı tüm kullanıcılar, şarj noktaları ve işlemler de silinecektir. Emin misiniz?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>
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
        </>
      )}
    </div>
  )
}

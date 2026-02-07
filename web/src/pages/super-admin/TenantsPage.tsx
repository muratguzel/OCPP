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
import { Plus, Pencil, Ban, CheckCircle } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

export function TenantsPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const { data: tenants = [], isLoading } = useQuery({
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
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              updateMutation.mutate({ name: editName })
            }
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
        </>
      )}
    </div>
  )
}

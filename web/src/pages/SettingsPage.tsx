import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/auth'

export function SettingsPage() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[#64748B]">Manage your account settings</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-[#64748B]">Name</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Email</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Role</dt>
              <dd className="font-medium capitalize">{user?.role?.replace('_', ' ')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

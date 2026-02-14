import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type User } from '@/store/auth'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth, hydrateTenantName } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<{
        accessToken: string
        refreshToken: string
        user: { id: string; email: string; name: string; role: 'super_admin' | 'admin' | 'user'; tenantId?: string }
      }>('/auth/login', { email, password })
      setAuth(data.user as User, data.accessToken, data.refreshToken)
      hydrateTenantName((tid) =>
        api.get<{ name: string }>(`/tenants/${tid}`).then((r) => r.data.name)
      )
      const role = data.user.role
      if (role === 'user') {
        navigate('/portal/history')
      } else {
        navigate('/dashboard')
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Geçersiz e-posta veya şifre'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1E293B] p-4">
      <Card className="w-full max-w-md border border-[#0F172A]">
        <CardHeader className="text-center">
          <img src="/logo.png" alt="Sarj Modul" className="mx-auto h-16 w-16 mb-2" />
          <CardTitle className="text-2xl">Sarj Modul</CardTitle>
          <CardDescription>
            EV Şarj İstasyonu Yönetim Platformu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sarjmodul.com"
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
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-[#EF4444]">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

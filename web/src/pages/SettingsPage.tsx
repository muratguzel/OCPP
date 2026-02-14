import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { useAuthStore } from '@/store/auth'
import { api } from '@/api/client'

export function SettingsPage() {
  const { user } = useAuthStore()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.post('/auth/change-password', payload),
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Şifre başarıyla değiştirildi.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    },
    onError: (err: { response?: { data?: { message?: string; error?: string } } }) => {
      setMessage({
        type: 'error',
        text: err.response?.data?.error ?? err.response?.data?.message ?? 'Şifre değiştirilemedi.',
      })
    },
  })

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!currentPassword || !newPassword) return
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' })
      return
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 8 karakter olmalı.' })
      return
    }
    if (!/[A-Z]/.test(newPassword)) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 1 büyük harf içermeli.' })
      return
    }
    if (!/[a-z]/.test(newPassword)) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 1 küçük harf içermeli.' })
      return
    }
    if (!/[0-9]/.test(newPassword)) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 1 rakam içermeli.' })
      return
    }
    changePasswordMutation.mutate({ currentPassword, newPassword })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Ayarlar</h1>
        <p className="text-[#64748B]">Hesap ayarlarınızı yönetin</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Hesap bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm text-[#64748B]">Ad Soyad</dt>
              <dd className="font-medium">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">E-posta</dt>
              <dd className="font-medium">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm text-[#64748B]">Rol</dt>
              <dd className="font-medium capitalize">{user?.role?.replace('_', ' ')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
          <CardDescription>Şifrenizi güncelleyin</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {message && (
              <p
                className={
                  message.type === 'success'
                    ? 'text-sm text-green-600'
                    : 'text-sm text-red-600'
                }
              >
                {message.text}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-[#64748B]">En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { Search, LogOut, User, Bell, HelpCircle, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useTenantFilterStore } from '@/store/tenantFilter'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) {
  const { user, clearAuth } = useAuthStore()
  const { selectedTenantId, setSelectedTenantId } = useTenantFilterStore()

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/tenants').then((r) => r.data),
    enabled: user?.role === 'super_admin',
  })

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch {
        // ignore
      }
    }
    clearAuth()
    window.location.href = '/login'
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-[#0F172A] bg-white px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onMobileMenuToggle}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      {(user?.role === 'super_admin' || user?.role === 'admin') && (
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[#64748B]">Tenant:</span>
          {user?.role === 'super_admin' && tenants.length > 0 ? (
            <select
              value={selectedTenantId ?? ''}
              onChange={(e) => setSelectedTenantId(e.target.value || null)}
              className="rounded border border-[#0F172A] bg-white px-3 py-1.5 text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="">Global (All)</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          ) : (
            <span className="rounded border border-[#0F172A] bg-white px-3 py-1.5 text-sm font-medium text-[#0F172A]">
              {user?.tenantName ?? 'My Tenant'}
            </span>
          )}
        </div>
      )}
      <div className="relative hidden sm:block flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
        <input
          type="search"
          placeholder="Search sessions, units..."
          className="h-9 w-full rounded border border-[#0F172A] bg-slate-50 pl-9 pr-4 text-sm placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5 text-[#64748B]" />
        </Button>
        <Button variant="ghost" size="icon" className="hidden sm:inline-flex rounded-full">
          <HelpCircle className="h-5 w-5 text-[#64748B]" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-xs text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 px-2 py-1.5">
              <User className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-[#64748B]">{user?.email}</span>
              </div>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="text-[#EF4444]">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

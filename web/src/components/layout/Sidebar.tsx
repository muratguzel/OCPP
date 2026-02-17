import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Zap,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  History,
  Wallet,
  Calculator,
  CreditCard,
  BarChart3,
  FileText,
  QrCode,
  DollarSign,
  Radio,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, type Role } from '@/store/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navByRole: Record<Role, { path: string; label: string; icon: React.ElementType }[]> = {
  super_admin: [
    { path: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
    { path: '/charge-points', label: 'Şarj Noktaları', icon: Zap },
    { path: '/connected-charge-points', label: 'Bağlı Şarj Noktaları', icon: Radio },
    { path: '/qr-codes', label: 'QR Kodları', icon: QrCode },
    { path: '/pricing', label: 'Fiyatlandırma', icon: DollarSign },
    { path: '/users', label: 'Kullanıcılar', icon: Users },
    { path: '/tenants', label: 'Firmalar', icon: Building2 },
    { path: '/transactions', label: 'İşlemler', icon: FileText },
    { path: '/payments', label: 'Ödemeler', icon: FileText },
    { path: '/reports', label: 'Raporlar', icon: BarChart3 },
    { path: '/settings', label: 'Ayarlar', icon: Settings },
  ],
  admin: [
    { path: '/dashboard', label: 'Kontrol Paneli', icon: LayoutDashboard },
    { path: '/charge-points', label: 'Şarj Noktaları', icon: Zap },
    { path: '/pricing', label: 'Fiyatlandırma', icon: DollarSign },
    { path: '/users', label: 'Kullanıcılar', icon: Users },
    { path: '/transactions', label: 'İşlemler', icon: FileText },
    { path: '/payments', label: 'Ödemeler', icon: FileText },
    { path: '/reports', label: 'Raporlar', icon: BarChart3 },
    { path: '/settings', label: 'Ayarlar', icon: Settings },
  ],
  user: [
    { path: '/portal/history', label: 'Şarj Geçmişi', icon: History },
    { path: '/portal/balance', label: 'Bakiye', icon: Wallet },
    { path: '/portal/savings', label: 'Tasarruf Hesaplayıcı', icon: Calculator },
    { path: '/portal/payment', label: 'Ödeme Yöntemleri', icon: CreditCard },
    { path: '/settings', label: 'Ayarlar', icon: Settings },
  ],
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const { user } = useAuthStore()
  const role = (user?.role ?? 'user') as Role
  const items = navByRole[role]

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'
  const roleLabel = role === 'super_admin' ? 'Sistem Yöneticisi' : role === 'admin' ? 'Firma Yöneticisi' : 'Kullanıcı'

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <img src="/logo.png" alt="Sarj Modul" className="h-9 w-9 shrink-0 rounded-md object-contain" />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-semibold text-white">Sarj Modul</span>
            <span className="block truncate text-xs text-slate-400">Şarj Yönetim Sistemi</span>
          </div>
        )}
        {/* Desktop: collapse toggle / Mobile: close button */}
        <button
          onClick={onToggle}
          className="hidden lg:block rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <button
          onClick={onMobileClose}
          className="lg:hidden rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Menüyü kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#E0F2FE] text-[#2563EB]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
                collapsed && 'lg:justify-center lg:px-2'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {/* Always show label on mobile overlay; hide on desktop when collapsed */}
            <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={cn(
        'border-t border-white/10 p-3',
        collapsed && 'lg:flex lg:flex-col lg:items-center'
      )}>
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'lg:flex-col'
        )}>
          <Avatar className="h-9 w-9 shrink-0 border-2 border-[#0F172A]">
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 hidden lg:flex h-screen flex-col border-r border-[#0F172A] bg-[#1E293B] text-white transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex lg:hidden h-screen w-64 flex-col border-r border-[#0F172A] bg-[#1E293B] text-white transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

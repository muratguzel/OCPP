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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, type Role } from '@/store/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navByRole: Record<Role, { path: string; label: string; icon: React.ElementType }[]> = {
  super_admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tenants', label: 'Charge Points', icon: Zap },
    { path: '/charge-points', label: 'Charge Points', icon: Zap },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  admin: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/charge-points', label: 'Charge Points', icon: Zap },
    { path: '/users', label: 'Users', icon: Users },
    { path: '/reports', label: 'Transactions', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
  user: [
    { path: '/portal/history', label: 'Charging History', icon: History },
    { path: '/portal/balance', label: 'Balance', icon: Wallet },
    { path: '/portal/savings', label: 'Savings Calculator', icon: Calculator },
    { path: '/portal/payment', label: 'Payment Methods', icon: CreditCard },
    { path: '/settings', label: 'Settings', icon: Settings },
  ],
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { user } = useAuthStore()
  const role = (user?.role ?? 'user') as Role
  const items = role === 'super_admin'
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/charge-points', label: 'Charge Points', icon: Zap },
          { path: '/qr-codes', label: 'QR Codes', icon: QrCode },
          { path: '/pricing', label: 'Pricing', icon: DollarSign },
          { path: '/users', label: 'Users', icon: Users },
          { path: '/tenants', label: 'Tenants', icon: Building2 },
          { path: '/transactions', label: 'Transactions', icon: FileText },
          { path: '/payments', label: 'Payments', icon: FileText },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings },
        ]
    : role === 'admin'
      ? [
          { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/charge-points', label: 'Charge Points', icon: Zap },
          { path: '/pricing', label: 'Pricing', icon: DollarSign },
          { path: '/users', label: 'Users', icon: Users },
          { path: '/transactions', label: 'Transactions', icon: FileText },
          { path: '/payments', label: 'Payments', icon: FileText },
          { path: '/reports', label: 'Reports', icon: BarChart3 },
          { path: '/settings', label: 'Settings', icon: Settings },
        ]
      : navByRole.user

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'U'
  const roleLabel = role === 'super_admin' ? 'System Admin' : role === 'admin' ? 'Tenant Admin' : 'User'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-[#0F172A] bg-[#1E293B] text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#2563EB] text-sm font-bold text-white">
          SM
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-semibold text-white">Sarj Modul</span>
            <span className="block truncate text-xs text-slate-400">Enterprise Suite</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#E0F2FE] text-[#2563EB]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className={cn(
        'border-t border-white/10 p-3',
        collapsed && 'flex flex-col items-center'
      )}>
        <div className={cn(
          'flex items-center gap-3',
          collapsed && 'flex-col'
        )}>
          <Avatar className="h-9 w-9 shrink-0 border-2 border-[#0F172A]">
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-slate-400">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

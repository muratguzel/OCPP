import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuthStore()

  const handleMobileClose = useCallback(() => setMobileOpen(false), [])

  if (!user) {
    return null
  }

  const isUserRole = user.role === 'user'

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />
      <div
        className={cn(
          'transition-all duration-300',
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className={cn('p-4 sm:p-6', !isUserRole && 'min-h-[calc(100vh-3.5rem)]')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

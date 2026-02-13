import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuthStore()

  if (!user) {
    return null
  }

  const isUserRole = user.role === 'user'
  const sidebarWidth = collapsed ? 64 : 256

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        {!isUserRole && <Header />}
        <main
          className={cn(
            'p-6',
            !isUserRole && 'min-h-[calc(100vh-3.5rem)]'
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

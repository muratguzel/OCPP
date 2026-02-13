import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoginPage } from '@/pages/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { DashboardOverview } from '@/pages/super-admin/DashboardOverview'
import { TenantsPage } from '@/pages/super-admin/TenantsPage'
import { QRCodesPage } from '@/pages/super-admin/QRCodesPage'
import { ConnectedChargePointsPage } from '@/pages/super-admin/ConnectedChargePointsPage'
import { ChargePointsPage } from '@/pages/tenant-admin/ChargePointsPage'
import { UsersPage } from '@/pages/tenant-admin/UsersPage'
import { ReportsPage } from '@/pages/tenant-admin/ReportsPage'
import { PricingPage } from '@/pages/tenant-admin/PricingPage'
import { PaymentsPage } from '@/pages/tenant-admin/PaymentsPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { ChargingHistoryPage } from '@/pages/end-user/ChargingHistoryPage'
import { BalancePage } from '@/pages/end-user/BalancePage'
import { SavingsCalculatorPage } from '@/pages/end-user/SavingsCalculatorPage'
import { SettingsPage } from '@/pages/SettingsPage'

const queryClient = new QueryClient()

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <DashboardOverview />
                </ProtectedRoute>
              }
            />
            <Route
              path="tenants"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <TenantsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="qr-codes"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <QRCodesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="charge-points"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <ChargePointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="connected-charge-points"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <ConnectedChargePointsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="pricing"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <PricingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="transactions"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <PaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/history"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <ChargingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/balance"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BalancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/savings"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <SavingsCalculatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/payment"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <BalancePage />
                </ProtectedRoute>
              }
            />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Payment Methods</h1>
        <p className="text-[#64748B]">Manage your payment methods</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CreditCard className="h-10 w-10 text-[#94A3B8]" />
          <p className="text-sm font-medium text-[#64748B]">Payment methods are not available yet</p>
          <p className="text-xs text-[#94A3B8]">
            You will be able to add and manage payment methods in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

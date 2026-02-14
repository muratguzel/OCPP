import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Ödeme Yöntemleri</h1>
        <p className="text-[#64748B]">Ödeme yöntemlerinizi yönetin</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <CreditCard className="h-10 w-10 text-[#94A3B8]" />
          <p className="text-sm font-medium text-[#64748B]">Ödeme yöntemleri henüz kullanılamıyor</p>
          <p className="text-xs text-[#94A3B8]">
            Gelecek bir güncellemede ödeme yöntemi ekleyip yönetebileceksiniz.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, CircleDot } from 'lucide-react'

const planned = [
  'Kredi / banka kartı ekleme',
  'Havale / EFT ödeme bilgileri',
  'Otomatik ödeme tanımlama',
  'Fatura bilgileri yönetimi',
]

export function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Ödeme Yöntemleri</h1>
        <p className="text-[#64748B]">Ödeme yöntemlerinizi yönetin</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <CreditCard className="h-10 w-10 text-[#94A3B8]" />
          <p className="text-sm font-medium text-[#64748B]">Ödeme yöntemleri henüz kullanılamıyor</p>
          <div className="mt-2 w-full max-w-xs text-left">
            <p className="mb-2 text-xs font-medium text-[#64748B]">Planlanan özellikler:</p>
            <ul className="space-y-1.5">
              {planned.map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-[#94A3B8]">
                  <CircleDot className="h-3 w-3 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

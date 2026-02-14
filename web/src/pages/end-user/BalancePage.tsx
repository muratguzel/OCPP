import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export function BalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Bakiye</h1>
        <p className="text-[#64748B]">Bakiye ve yükleme seçenekleriniz</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Wallet className="h-10 w-10 text-[#94A3B8]" />
          <p className="text-sm font-medium text-[#64748B]">Bakiye özelliği henüz kullanılamıyor</p>
          <p className="text-xs text-[#94A3B8]">
            Bakiye yönetimi ve yükleme seçenekleri gelecek bir güncellemede kullanılabilir olacaktır.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

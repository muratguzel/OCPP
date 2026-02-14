import { Card, CardContent } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export function BalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Balance</h1>
        <p className="text-[#64748B]">Your balance and top-up options</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Wallet className="h-10 w-10 text-[#94A3B8]" />
          <p className="text-sm font-medium text-[#64748B]">Balance feature is not available yet</p>
          <p className="text-xs text-[#94A3B8]">
            Balance management and top-up options will be available in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

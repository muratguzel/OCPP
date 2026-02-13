import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Wallet, CreditCard } from 'lucide-react'

export function BalancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Balance & Payments</h1>
        <p className="text-[#64748B]">Your balance and payment methods</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Current Balance
            </CardTitle>
            <CardDescription>Available balance for charging</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#0F172A]">₺0.00</p>
            <p className="mt-2 text-sm text-[#64748B]">
              Payment methods integration coming soon
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-[#64748B]">No payment methods added yet.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

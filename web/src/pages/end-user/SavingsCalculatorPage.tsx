import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Leaf } from 'lucide-react'

const CO2_PER_KM_GAS = 0.12
const KM_PER_KWH = 5

export function SavingsCalculatorPage() {
  const [kwh, setKwh] = useState('')
  const [km, setKm] = useState('')
  const [result, setResult] = useState<{ co2Saved: number; equivKm: number } | null>(null)

  const calculate = (e: React.FormEvent) => {
    e.preventDefault()
    const kwhNum = parseFloat(kwh)
    const kmNum = parseFloat(km)
    if (kwhNum > 0) {
      const equivKm = kwhNum * KM_PER_KWH
      const co2Saved = equivKm * CO2_PER_KM_GAS
      setResult({ co2Saved, equivKm })
    } else if (kmNum > 0) {
      const co2Saved = kmNum * CO2_PER_KM_GAS
      setResult({ co2Saved, equivKm: kmNum })
    } else {
      setResult(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">CO2 Savings Calculator</h1>
        <p className="text-[#64748B]">
          Compare your EV charging to equivalent gas vehicle emissions
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#10B981]" />
            Calculate Savings
          </CardTitle>
          <CardDescription>
            Enter kWh charged or km driven. Gas equivalent: ~0.12 kg CO2/km.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={calculate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kwh">Energy charged (kWh)</Label>
              <Input
                id="kwh"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 50"
                value={kwh}
                onChange={(e) => {
                  setKwh(e.target.value)
                  setKm('')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">Or km driven (equivalent)</Label>
              <Input
                id="km"
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 250"
                value={km}
                onChange={(e) => {
                  setKm(e.target.value)
                  setKwh('')
                }}
              />
            </div>
            <Button type="submit">Calculate</Button>
          </form>
          {result && (
            <div className="mt-6 rounded-lg border-2 border-[#10B981] bg-[#10B981]/10 p-4">
              <p className="font-semibold text-[#0F172A]">
                CO2 saved: ~{result.co2Saved.toFixed(1)} kg
              </p>
              <p className="text-sm text-[#64748B]">
                Equivalent to driving {result.equivKm.toFixed(0)} km in a gas vehicle
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

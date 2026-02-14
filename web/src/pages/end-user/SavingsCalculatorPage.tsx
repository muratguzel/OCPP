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
import { toast } from 'sonner'

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
    if (!kwh.trim() && !km.trim()) {
      toast.error('kWh veya km değeri girin')
      return
    }
    if (kwh.trim()) {
      if (Number.isNaN(kwhNum) || kwhNum <= 0) { toast.error('kWh pozitif bir sayı olmalı'); return }
      if (kwhNum > 100000) { toast.error('kWh değeri çok büyük (maks 100.000)'); return }
      const equivKm = kwhNum * KM_PER_KWH
      const co2Saved = equivKm * CO2_PER_KM_GAS
      setResult({ co2Saved, equivKm })
    } else {
      if (Number.isNaN(kmNum) || kmNum <= 0) { toast.error('Km pozitif bir sayı olmalı'); return }
      if (kmNum > 500000) { toast.error('Km değeri çok büyük (maks 500.000)'); return }
      const co2Saved = kmNum * CO2_PER_KM_GAS
      setResult({ co2Saved, equivKm: kmNum })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">CO2 Tasarruf Hesaplayıcı</h1>
        <p className="text-[#64748B]">
          EV şarjınızı eşdeğer benzinli araç emisyonlarıyla karşılaştırın
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-[#10B981]" />
            Tasarrufu Hesapla
          </CardTitle>
          <CardDescription>
            Şarj edilen kWh veya gidilen km girin. Benzin eşdeğeri: ~0.12 kg CO2/km.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={calculate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kwh">Şarj edilen enerji (kWh)</Label>
              <Input
                id="kwh"
                type="number"
                min="0"
                max="100000"
                step="0.1"
                placeholder="örn. 50"
                value={kwh}
                onChange={(e) => {
                  setKwh(e.target.value)
                  setKm('')
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="km">Veya gidilen km (eşdeğer)</Label>
              <Input
                id="km"
                type="number"
                min="0"
                max="500000"
                step="1"
                placeholder="örn. 250"
                value={km}
                onChange={(e) => {
                  setKm(e.target.value)
                  setKwh('')
                }}
              />
            </div>
            <Button type="submit">Hesapla</Button>
          </form>
          {result && (
            <div className="mt-6 rounded-lg border-2 border-[#10B981] bg-[#10B981]/10 p-4">
              <p className="font-semibold text-[#0F172A]">
                Tasarruf edilen CO2: ~{result.co2Saved.toFixed(1)} kg
              </p>
              <p className="text-sm text-[#64748B]">
                Benzinli araçta {result.equivKm.toFixed(0)} km sürmeye eşdeğer
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

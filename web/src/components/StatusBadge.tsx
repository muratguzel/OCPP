import { cn } from '@/lib/utils'

const statusVariants: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  available: { bg: 'bg-[#10B981]/20', border: 'border-[#10B981]', text: 'text-[#0d9668]' },
  completed: { bg: 'bg-[#10B981]/20', border: 'border-[#10B981]', text: 'text-[#0d9668]' },
  charging: { bg: 'bg-[#BFDBFE]', border: 'border-[#93C5FD]', text: 'text-[#1E40AF]' },
  occupied: { bg: 'bg-[#BFDBFE]', border: 'border-[#93C5FD]', text: 'text-[#1E40AF]' },
  faulted: { bg: 'bg-[#EF4444]/20', border: 'border-[#EF4444]', text: 'text-[#dc2626]' },
  offline: { bg: 'bg-slate-200', border: 'border-slate-400', text: 'text-slate-600' },
  preparing: { bg: 'bg-amber-100', border: 'border-amber-500', text: 'text-amber-700' },
  error: { bg: 'bg-[#EF4444]/20', border: 'border-[#EF4444]', text: 'text-[#dc2626]' },
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const normalized = status?.toLowerCase() ?? 'offline'
  const variant = statusVariants[normalized] ?? statusVariants.offline

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-xs font-medium',
        variant.bg,
        variant.border,
        variant.text,
        className
      )}
    >
      {status || 'Offline'}
    </span>
  )
}

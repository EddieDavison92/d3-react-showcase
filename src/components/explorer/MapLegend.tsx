import { interpolateRamp } from "@/lib/explorer/colours"
import { formatYears } from "@/lib/explorer/format"
import { cn } from "@/lib/utils"

export function MapLegend({
  min,
  max,
  ramp,
  unit,
  reverseLabel,
  note,
  zeroTick,
}: {
  min: number
  max: number
  ramp: readonly string[]
  unit: string
  reverseLabel?: boolean
  note?: string
  zeroTick?: boolean
}) {
  const stops = Array.from({ length: 24 }, (_, i) => interpolateRamp(ramp, i / 23))
  return (
    <div className="w-full py-1 text-[11px]">
      <div className="mb-1 flex justify-between text-muted-foreground">
        <span>{reverseLabel ? formatYears(max, 0) : formatYears(min, 0)}</span>
        <span className="motion-safe:transition-opacity motion-safe:duration-200">{unit}</span>
        <span>{reverseLabel ? formatYears(min, 0) : formatYears(max, 0)}</span>
      </div>
      <div className="relative flex h-2 overflow-hidden rounded-sm">
        {(reverseLabel ? [...stops].reverse() : stops).map((colour, i) => (
          <span key={i} className="h-full flex-1" style={{ background: colour }} />
        ))}
        {zeroTick ? (
          <span className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-700/70" />
        ) : null}
      </div>
      {zeroTick ? (
        <p
          className={cn(
            "mt-0.5 text-center text-[10px] text-muted-foreground motion-safe:transition-opacity motion-safe:duration-200"
          )}
        >
          0
        </p>
      ) : null}
      {note ? <p className="mt-1 text-muted-foreground">{note}</p> : null}
    </div>
  )
}

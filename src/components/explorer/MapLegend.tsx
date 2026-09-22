import { interpolateRamp } from "@/lib/explorer/colours"
import { formatYears } from "@/lib/explorer/format"

export function MapLegend({
  min,
  max,
  ramp,
  unit,
  reverseLabel,
}: {
  min: number
  max: number
  ramp: readonly string[]
  unit: string
  reverseLabel?: boolean
}) {
  const stops = Array.from({ length: 24 }, (_, i) => interpolateRamp(ramp, i / 23))
  return (
    <div className="rounded-md border bg-background/90 p-2 text-[11px] shadow-sm">
      <div className="mb-1 flex justify-between text-muted-foreground">
        <span>{reverseLabel ? formatYears(max, 0) : formatYears(min, 0)}</span>
        <span>{unit}</span>
        <span>{reverseLabel ? formatYears(min, 0) : formatYears(max, 0)}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-sm">
        {(reverseLabel ? [...stops].reverse() : stops).map((colour, i) => (
          <span key={i} className="h-full flex-1" style={{ background: colour }} />
        ))}
      </div>
    </div>
  )
}

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
  leftLabel,
  rightLabel,
  leftLabelShort,
  rightLabelShort,
  ariaLabel,
}: {
  min: number
  max: number
  ramp: readonly string[]
  unit: string
  reverseLabel?: boolean
  note?: string
  zeroTick?: boolean
  leftLabel?: string
  rightLabel?: string
  leftLabelShort?: string
  rightLabelShort?: string
  ariaLabel?: string
}) {
  const left = leftLabel ?? (reverseLabel ? "Higher" : "Lower")
  const right = rightLabel ?? (reverseLabel ? "Lower" : "Higher")
  const stops = Array.from({ length: 24 }, (_, i) => interpolateRamp(ramp, i / 23))
  return (
    <div
      className="w-full py-1 text-[11px]"
      role="img"
      aria-label={ariaLabel ?? `${left} to ${right}, ${unit}`}
    >
      <div className="mb-1 flex justify-between gap-2 text-muted-foreground">
        <span>
          <EndLabel full={left} shortLabel={leftLabelShort} />{" "}
          <span className="tabular-nums">
            {reverseLabel ? formatYears(max, 0) : formatYears(min, 0)}
          </span>
        </span>
        <span className="motion-safe:transition-opacity motion-safe:duration-200">{unit}</span>
        <span>
          <EndLabel full={right} shortLabel={rightLabelShort} />{" "}
          <span className="tabular-nums">
            {reverseLabel ? formatYears(min, 0) : formatYears(max, 0)}
          </span>
        </span>
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

function EndLabel({ full, shortLabel }: { full: string; shortLabel?: string }) {
  if (!shortLabel) return <>{full}</>
  return (
    <>
      <span className="hidden sm:inline">{full}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </>
  )
}

import { interpolateRamp, linearT } from "@/lib/explorer/colours"
import { formatSigned, formatYears } from "@/lib/explorer/format"
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
  marker,
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
  /** Selected area on the scale — ties the focus card to the ramp. */
  marker?: { value: number; label: string } | null
}) {
  const left = leftLabel ?? (reverseLabel ? "Higher" : "Lower")
  const right = rightLabel ?? (reverseLabel ? "Lower" : "Higher")
  const digits = unit.includes("100,000") ? 0 : 1
  const end = (value: number) => (zeroTick ? formatSigned(value, digits) : formatYears(value, 0))
  const stops = Array.from({ length: 24 }, (_, i) => interpolateRamp(ramp, i / 23))
  const markerT = marker ? Math.max(0, Math.min(1, linearT(marker.value, min, max))) : null
  const markerAt = markerT === null ? null : reverseLabel ? 1 - markerT : markerT
  return (
    <div
      className="w-full py-1 text-xs"
      role="img"
      aria-label={ariaLabel ?? `${left} to ${right}, ${unit}`}
    >
      <div className="mb-1.5 flex justify-between gap-2 text-muted-foreground">
        <span>
          <EndLabel full={left} shortLabel={leftLabelShort} />{" "}
          <span className="tabular-nums">
            {reverseLabel ? end(max) : end(min)}
          </span>
        </span>
        <span className="motion-safe:transition-opacity motion-safe:duration-200">{unit}</span>
        <span>
          <EndLabel full={right} shortLabel={rightLabelShort} />{" "}
          <span className="tabular-nums">
            {reverseLabel ? end(min) : end(max)}
          </span>
        </span>
      </div>
      <div className="relative">
        <div className="relative flex h-2 overflow-hidden rounded-sm">
          {(reverseLabel ? [...stops].reverse() : stops).map((colour, i) => (
            <span key={i} className="h-full flex-1" style={{ background: colour }} />
          ))}
          {zeroTick ? (
            <span className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-700/70" />
          ) : null}
        </div>
        {markerAt !== null && marker ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-1 h-4 w-[3px] -translate-x-1/2 rounded-full bg-slate-900 ring-2 ring-white motion-safe:transition-[left] motion-safe:duration-200 dark:bg-white dark:ring-slate-900"
            style={{ left: `${markerAt * 100}%` }}
          />
        ) : null}
      </div>
      {zeroTick || (markerAt !== null && marker) ? (
        <div className="relative mt-1 h-4 text-[11px] text-muted-foreground">
          {zeroTick && (markerAt === null || Math.abs(markerAt - 0.5) > 0.12) ? (
            <span className="absolute left-1/2 -translate-x-1/2 tabular-nums">0</span>
          ) : null}
          {markerAt !== null && marker ? (
            <span
              className={cn(
                "absolute whitespace-nowrap font-medium tabular-nums text-foreground motion-safe:transition-[left] motion-safe:duration-200",
                markerAt < 0.15 ? "" : markerAt > 0.85 ? "-translate-x-full" : "-translate-x-1/2"
              )}
              style={{ left: `${markerAt * 100}%` }}
            >
              {marker.label} {zeroTick ? formatSigned(marker.value, digits) : formatYears(marker.value, digits)}
            </span>
          ) : null}
        </div>
      ) : null}
      {note ? <p className="text-muted-foreground">{note}</p> : null}
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

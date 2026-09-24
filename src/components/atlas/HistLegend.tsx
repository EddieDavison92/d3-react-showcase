"use client"

import { useMemo } from "react"
import { interpolateRamp } from "@/lib/explorer/colours"
import { formatSigned, formatYears } from "@/lib/explorer/format"

const BINS = 32
const W = 320
const H = 38

/** Colour legend that doubles as a histogram of every area on the map. */
export function HistLegend({
  values,
  ramp,
  min,
  max,
  diverging,
  caption,
  leftLabel,
  rightLabel,
  marker,
  digits,
}: {
  values: (number | null)[]
  ramp: readonly string[]
  min: number
  max: number
  diverging: boolean
  caption: string
  leftLabel: string
  rightLabel: string
  marker?: { value: number; label: string } | null
  digits: number
}) {
  const bins = useMemo(() => {
    const counts = new Array(BINS).fill(0)
    for (const v of values) {
      if (v === null || !Number.isFinite(v)) continue
      const i = Math.max(0, Math.min(BINS - 1, Math.floor(((v - min) / (max - min || 1)) * BINS)))
      counts[i] += 1
    }
    return counts as number[]
  }, [values, min, max])
  const peak = Math.max(1, ...bins)
  const bw = W / BINS
  const fmt = (v: number) => (diverging ? formatSigned(v, digits) : formatYears(v, digits))
  const mx = marker ? Math.max(0, Math.min(1, (marker.value - min) / (max - min || 1))) * W : null

  return (
    <figure className="w-full">
      <figcaption className="mb-1.5 flex items-baseline justify-between gap-3 text-2xs text-ink-3">
        <span>{caption}</span>
        {marker ? (
          <span className="truncate text-ink">
            <span className="font-semibold">{marker.label}</span>{" "}
            <span className="tabular">{diverging ? formatSigned(marker.value, 1) : formatYears(marker.value, digits === 0 ? 1 : digits)}</span>
          </span>
        ) : null}
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H + 8}`} preserveAspectRatio="none" className="h-12 w-full overflow-visible" role="img" aria-label={`${caption}: distribution of areas from ${fmt(min)} to ${fmt(max)}`}>
        {bins.map((count, i) => {
          const h = count ? Math.max(2, (count / peak) * (H - 8)) : 0
          return (
            <rect
              key={i}
              x={i * bw + 0.75}
              y={H - h}
              width={bw - 1.5}
              height={h}
              rx={1.5}
              fill={interpolateRamp(ramp, (i + 0.5) / BINS)}
            />
          )
        })}
        <rect x={0} y={H + 2} width={W} height={4} rx={2} fill="url(#legend-ramp)" />
        <defs>
          <linearGradient id="legend-ramp">
            {ramp.map((c, i) => (
              <stop key={i} offset={`${(i / (ramp.length - 1)) * 100}%`} stopColor={c} />
            ))}
          </linearGradient>
        </defs>
        {diverging ? <line x1={W / 2} x2={W / 2} y1={0} y2={H + 6} stroke="#111315" strokeOpacity={0.4} vectorEffect="non-scaling-stroke" /> : null}
        {mx !== null ? (
          <g style={{ transform: `translateX(${mx}px)`, transition: "transform 300ms ease" }}>
            <line y1={0} y2={H + 6} stroke="#111315" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </g>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-2xs tabular text-ink-3">
        <span>
          {leftLabel} {fmt(min)}
        </span>
        {diverging ? <span>0</span> : null}
        <span>
          {rightLabel} {fmt(max)}
        </span>
      </div>
    </figure>
  )
}

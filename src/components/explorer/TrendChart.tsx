"use client"

import { useMemo, useState } from "react"
import * as d3 from "d3"
import { useWidth } from "@/components/explorer/use-width"
import { compactPeriod, formatYears } from "@/lib/explorer/format"
import type { PackedPoint } from "@/lib/explorer/types"

export type TrendSeries = {
  code: string
  name: string
  colour: string
  points: PackedPoint[]
  /** Draws the 95% interval band. */
  band?: boolean
}

const HEIGHT = 168
const MARGIN = { top: 10, right: 12, bottom: 22, left: 30 }

export function TrendChart({
  periods,
  series,
  year,
  digits = 1,
  onYear,
}: {
  periods: string[]
  series: TrendSeries[]
  year: string
  digits?: number
  onYear: (year: string) => void
}) {
  const [wrapRef, width] = useWidth<HTMLDivElement>(340)
  const [hover, setHover] = useState<number | null>(null)
  const innerW = Math.max(40, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

  const x = useMemo(
    () => d3.scalePoint<number>().domain(d3.range(periods.length)).range([0, innerW]),
    [innerW, periods.length]
  )
  const y = useMemo(() => {
    const vals: number[] = []
    for (const s of series) {
      for (const [v, lo, hi] of s.points) {
        if (v !== null) vals.push(v)
        if (s.band && lo !== null) vals.push(lo)
        if (s.band && hi !== null) vals.push(hi)
      }
    }
    const [min, max] = vals.length ? (d3.extent(vals) as [number, number]) : [0, 1]
    return d3.scaleLinear().domain([min, max]).nice(4).range([innerH, 0])
  }, [innerH, series])

  const line = d3
    .line<PackedPoint>()
    .defined((d) => d[0] !== null)
    .x((_, i) => x(i) ?? 0)
    .y((d) => y(d[0] as number))
  const band = d3
    .area<PackedPoint>()
    .defined((d) => d[1] !== null && d[2] !== null)
    .x((_, i) => x(i) ?? 0)
    .y0((d) => y(d[1] as number))
    .y1((d) => y(d[2] as number))

  const yearIndex = periods.indexOf(year)
  const active = hover ?? yearIndex
  const step = periods.length > 1 ? innerW / (periods.length - 1) : innerW

  const indexAt = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left - MARGIN.left
    return Math.max(0, Math.min(periods.length - 1, Math.round(px / step)))
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        className="block touch-none select-none"
        role="img"
        aria-label={`Trend ${compactPeriod(periods[0] ?? "")} to ${compactPeriod(periods.at(-1) ?? "")}: ${series.map((s) => s.name).join(", ")}`}
        onPointerMove={(event) => setHover(indexAt(event.clientX, event.currentTarget.getBoundingClientRect()))}
        onPointerLeave={() => setHover(null)}
        onClick={(event) => onYear(periods[indexAt(event.clientX, event.currentTarget.getBoundingClientRect())])}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(4).map((tick) => (
            <g key={tick} transform={`translate(0,${y(tick)})`}>
              <line x2={innerW} stroke="#eef0f3" />
              <text x={-6} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[10px] tabular-nums">
                {tick}
              </text>
            </g>
          ))}
          {[0, periods.length - 1].map((i) => (
            <text
              key={i}
              x={x(i)}
              y={innerH + 16}
              textAnchor={i === 0 ? "start" : "end"}
              className="fill-slate-500 text-[10px] tabular-nums"
            >
              {compactPeriod(periods[i])}
            </text>
          ))}
          {active >= 0 ? (
            <line
              x1={x(active)}
              x2={x(active)}
              y2={innerH}
              stroke={hover === null ? "#cbd5e1" : "#94a3b8"}
            />
          ) : null}
          {series.map((s) =>
            s.band ? (
              <path key={`${s.code}-band`} d={band(s.points) ?? ""} fill={s.colour} opacity={0.12} />
            ) : null
          )}
          {[...series].reverse().map((s) => (
            <path
              key={s.code}
              d={line(s.points) ?? ""}
              fill="none"
              stroke={s.colour}
              strokeWidth={s.band ? 2 : 1.5}
              strokeLinejoin="round"
            />
          ))}
          {active >= 0
            ? series.map((s) => {
                const v = s.points[active]?.[0]
                if (v === null || v === undefined) return null
                return (
                  <circle
                    key={`${s.code}-dot`}
                    cx={x(active)}
                    cy={y(v)}
                    r={s.band ? 4 : 3}
                    fill={s.colour}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              })
            : null}
        </g>
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-10 min-w-[9rem] rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md"
          style={{
            left: Math.min(width - 150, Math.max(0, MARGIN.left + (x(hover) ?? 0) + 10)),
          }}
        >
          <p className="font-medium text-slate-900">{compactPeriod(periods[hover])}</p>
          {series.map((s) => (
            <p key={s.code} className="mt-0.5 flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.colour }} />
              <span className="truncate">{s.name}</span>
              <span className="ml-auto pl-2 font-medium tabular-nums text-slate-900">
                {formatYears(s.points[hover]?.[0], digits)}
              </span>
            </p>
          ))}
        </div>
      ) : null}
      {series.length > 1 ? (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {series.map((s) => (
            <span key={s.code} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded-full" style={{ background: s.colour }} />
              {s.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

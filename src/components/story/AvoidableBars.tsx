"use client"

import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { decileColour, INK, INK_3, LINE, PAPER } from "@/lib/story/palette"

const ROSE = "#b3452c"
const FELL = "#1f7f6c"
const EASE = "cubic-bezier(0.65,0,0.25,1)"

/**
 * Avoidable death rate per deprivation tenth: a bar for now, a tick for the
 * earlier period, and the change beside it. Bars grow when active.
 */
export function AvoidableBars({
  rows,
  label,
  shortLabel = label,
  periods,
  active,
}: {
  /** One per tenth, most deprived first. */
  rows: { then: number | null; now: number | null }[]
  label: string
  shortLabel?: string
  periods: { then: string; now: string }
  active: boolean
}) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const narrow = width < 560
  const M = { top: 76, right: narrow ? 72 : 96, bottom: 56, left: narrow ? 40 : 128 }
  const w = Math.max(10, width - M.left - M.right)
  const h = Math.max(10, height - M.top - M.bottom)
  const peak = d3.max(rows.flatMap((r) => [r.then ?? 0, r.now ?? 0])) ?? 1
  const x = d3.scaleLinear().domain([0, peak]).nice().range([0, w])
  const step = h / 10
  const bh = Math.min(30, step * 0.55)

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width={width} height={height} className="chart" role="img" aria-label={`${label}, by deprivation tenth`}>
        <g transform={`translate(${M.left},${M.top})`}>
          <text x={-M.left} y={-44} fontSize={10.5} fill={INK_3}>
            {narrow ? shortLabel : label}
          </text>
          <g transform={`translate(${-M.left},-26)`} style={{ opacity: active ? 1 : 0, transition: "opacity 400ms 900ms" }}>
            {[3, 8].map((d, k) => (
              <rect key={d} x={k * 7} width={7} height={8} y={-7} rx={1.5} fill={decileColour(d)} />
            ))}
            <text x={20} fontSize={10.5} fill={INK_3}>
              {periods.now}
            </text>
            <line x1={80} x2={80} y1={-9} y2={2} stroke={INK} strokeWidth={2} />
            <text x={88} fontSize={10.5} fill={INK_3}>
              {periods.then}
            </text>
          </g>
          {x.ticks(narrow ? 4 : 6).map((t) => (
            <g key={t} transform={`translate(${x(t)},0)`}>
              <line y1={-6} y2={h} stroke={t === 0 ? INK : LINE} opacity={t === 0 ? 0.7 : 0.9} />
              <text y={h + 20} textAnchor="middle" fontSize={10.5} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}
          <text x={w} y={h + 40} textAnchor="end" fontSize={10.5} fill={INK_3}>
            Deaths per 100,000 →
          </text>

          {rows.map((r, d) => {
            if (r.now === null) return null
            const change = r.then === null ? null : r.now - r.then
            return (
              <g key={d} transform={`translate(0,${d * step + (step - bh) / 2})`}>
                <text x={-12} y={bh / 2} dy="0.32em" textAnchor="end" fontSize={11} fill={INK}>
                  {narrow ? d + 1 : d === 0 ? "1 · most deprived" : d === 9 ? "10 · least" : d + 1}
                </text>
                <rect
                  width={x(r.now)}
                  height={bh}
                  rx={3}
                  fill={decileColour(d + 1)}
                  style={{
                    transformOrigin: "0px 0px",
                    transform: `scaleX(${active ? 1 : 0})`,
                    transition: `transform 900ms ${EASE} ${active ? 200 + d * 50 : 0}ms`,
                  }}
                />
                {r.then !== null ? (
                  <line
                    x1={x(r.then)}
                    x2={x(r.then)}
                    y1={-3}
                    y2={bh + 3}
                    stroke={INK}
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ opacity: active ? 1 : 0, transition: `opacity 400ms ${active ? 900 + d * 50 : 0}ms` }}
                  />
                ) : null}
                <text
                  x={Math.max(x(r.now), x(r.then ?? 0)) + 8}
                  y={bh / 2}
                  dy="0.32em"
                  fontSize={12}
                  fill={INK}
                  stroke={PAPER}
                  strokeWidth={4}
                  paintOrder="stroke"
                  style={{ opacity: active ? 1 : 0, transition: `opacity 300ms ${active ? 900 + d * 50 : 0}ms` }}
                >
                  <tspan fontWeight={600}>{Math.round(r.now)}</tspan>
                  {change !== null ? (
                    <tspan dx={6} fontSize={11} fill={change > 0 ? ROSE : FELL}>
                      {Math.round(change) === 0 ? "±0" : `${change > 0 ? "+" : "−"}${Math.abs(Math.round(change))}`}
                    </tspan>
                  ) : null}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

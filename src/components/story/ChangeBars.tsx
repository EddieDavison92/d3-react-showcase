"use client"

import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { formatSigned } from "@/lib/explorer/format"
import { INK, INK_3, LINE, PAPER } from "@/lib/story/palette"

const FELL = "#b3452c"
const ROSE = "#1f7f6c"
const EASE = "cubic-bezier(0.65,0,0.25,1)"

/**
 * Average change in life expectancy per deprivation tenth, as bars either
 * side of zero. Bars grow from zero when the step becomes active.
 */
export function ChangeBars({
  changes,
  others,
  label,
  otherLabel,
  shortLabel = label,
  active,
}: {
  /** One value per tenth, most deprived first. */
  changes: number[]
  /** Same for the other sex, drawn as a thin marker for comparison. */
  others?: number[]
  label: string
  otherLabel?: string
  /** Title for phones. */
  shortLabel?: string
  active: boolean
}) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const narrow = width < 560
  const M = { top: 76, right: 56, bottom: 56, left: narrow ? 40 : 128 }
  const w = Math.max(10, width - M.left - M.right)
  const h = Math.max(10, height - M.top - M.bottom)
  const all = [...changes, ...(others ?? []), 0]
  const x = d3
    .scaleLinear()
    .domain([Math.min(-0.2, d3.min(all)! - (narrow ? 0.22 : 0.08)), Math.max(0.8, d3.max(all)! + 0.1)])
    .nice()
    .range([0, w])
  // Rows share the full height, like the charts either side; bars stay slim.
  const step = h / 10
  const bh = Math.min(30, step * 0.55)
  const y = (d: number) => d * step + (step - bh) / 2

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width={width} height={height} className="chart" role="img" aria-label={`${label}, by deprivation tenth`}>
        <g transform={`translate(${M.left},${M.top})`}>
          <text x={-M.left} y={-44} fontSize={10.5} fill={INK_3}>
            {narrow ? shortLabel : label}
          </text>
          {otherLabel ? (
            <g transform={`translate(${-M.left},-26)`} style={{ opacity: active ? 1 : 0, transition: "opacity 400ms 900ms" }}>
              <rect width={7} height={8} y={-7} rx={1.5} fill={FELL} />
              <rect x={7} width={7} height={8} y={-7} rx={1.5} fill={ROSE} />
              <text x={20} fontSize={10.5} fill={INK_3}>
                Men
              </text>
              <line x1={62} x2={62} y1={-9} y2={2} stroke={INK} strokeWidth={2} />
              <text x={70} fontSize={10.5} fill={INK_3}>
                {otherLabel}
              </text>
            </g>
          ) : null}
          {x.ticks(6).map((t) => (
            <g key={t} transform={`translate(${x(t)},0)`}>
              <line y1={-6} y2={h} stroke={t === 0 ? INK : LINE} strokeWidth={t === 0 ? 1.25 : 1} opacity={t === 0 ? 0.7 : 0.9} />
              <text y={h + 20} textAnchor="middle" fontSize={10.5} fill={INK_3}>
                {t === 0 ? "0" : formatSigned(t, 1)}
              </text>
            </g>
          ))}
          <text x={w} y={h + 40} textAnchor="end" fontSize={10.5} fill={INK_3}>
            Change since 2011–13, years →
          </text>
          <text x={x(0) - 6} y={-10} textAnchor="end" fontSize={10.5} fill={FELL}>
            ← fell
          </text>
          <text x={x(0) + 6} y={-10} fontSize={10.5} fill={ROSE}>
            rose →
          </text>

          {changes.map((c, d) => {
            const y0 = y(d)
            const x0 = x(0)
            const len = Math.abs(x(c) - x0)
            const left = c < 0
            const tone = left ? FELL : ROSE
            const other = others?.[d]
            return (
              <g key={d} transform={`translate(0,${y0})`}>
                <text x={-12} y={bh / 2} dy="0.32em" textAnchor="end" fontSize={11} fill={INK}>
                  {narrow ? d + 1 : d === 0 ? "1 · most deprived" : d === 9 ? "10 · least" : d + 1}
                </text>
                <rect
                  x={left ? x0 - len : x0}
                  width={len}
                  height={bh}
                  rx={3}
                  fill={tone}
                  style={{
                    transformOrigin: `${x0}px 0px`,
                    transform: `scaleX(${active ? 1 : 0})`,
                    transition: `transform 900ms ${EASE} ${active ? 200 + d * 50 : 0}ms`,
                  }}
                />
                {other !== undefined ? (
                  <line
                    x1={x(other)}
                    x2={x(other)}
                    y1={-3}
                    y2={bh + 3}
                    stroke={INK}
                    strokeWidth={2}
                    strokeLinecap="round"
                    style={{ opacity: active ? 1 : 0, transition: `opacity 400ms ${active ? 900 + d * 50 : 0}ms` }}
                  />
                ) : null}
                <text
                  x={left ? Math.min(x0, x(c)) - 8 : Math.max(x0, x(c)) + 8}
                  y={bh / 2}
                  dy="0.32em"
                  textAnchor={left ? "end" : "start"}
                  fontSize={12}
                  fontWeight={600}
                  fill={tone}
                  stroke={PAPER}
                  strokeWidth={4}
                  paintOrder="stroke"
                  style={{ opacity: active ? 1 : 0, transition: `opacity 300ms ${active ? 900 + d * 50 : 0}ms` }}
                >
                  {formatSigned(c)}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

"use client"

import { useState } from "react"
import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { useTween } from "@/components/story/use-tween"
import { formatYears } from "@/lib/explorer/format"
import { decileColour, INK, INK_3, LINE, PAPER } from "@/lib/story/palette"
import type { StoryData } from "@/lib/story/data"

const EASE = "cubic-bezier(0.65,0,0.25,1)"

/** Mean life expectancy of each deprivation tenth over time, with the gap bracketed. Draws when active. */
export function DecileLines({ data, sex, active = true }: { data: StoryData; sex: "male" | "female"; active?: boolean }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const narrow = width < 560
  const M = { top: 64, right: narrow ? 64 : 150, bottom: 48, left: 40 }
  const target = sex === "male" ? data.deciles.male : data.deciles.female
  const gapSeries = sex === "male" ? data.deciles.gapMale : data.deciles.gapFemale
  const { periods, index } = data
  const w = Math.max(10, width - M.left - M.right)
  const h = Math.max(10, height - M.top - M.bottom)
  const x = d3.scaleLinear().domain([0, periods.length - 1]).range([0, w])
  const all = target.flat().filter((v): v is number => v !== null)
  const domain = [Math.floor(d3.min(all)! - 0.5), Math.ceil(d3.max(all)! + 0.5)]
  // Lines and axis glide together when the sex changes; NaN stands in for a missing value.
  const tweened = useTween([...domain, ...target.flat().map((v) => v ?? NaN)], 900)
  const n = periods.length
  const rows = target.map((_, d) => tweened.slice(2 + d * n, 2 + (d + 1) * n).map((v) => (Number.isFinite(v) ? v : null)))
  const y = d3.scaleLinear().domain([tweened[0], tweened[1]]).range([h, 0])
  const line = d3
    .line<number | null>()
    .defined((v) => v !== null)
    .x((_, i) => x(i))
    .y((v) => y(v as number))
    .curve(d3.curveMonotoneX)

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg
        width={width}
        height={height}
        className="chart"
        role="img"
        aria-label="Life expectancy by deprivation tenth over time"
        onPointerMove={(e) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left - M.left
          setHover(Math.max(0, Math.min(periods.length - 1, Math.round(x.invert(px)))))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <g transform={`translate(${M.left},${M.top})`}>
          <text x={-M.left} y={-40} fontSize={10.5} fill={INK_3}>
            {sex === "male" ? "Men" : "Women"}, England: mean life expectancy of the local authorities in each deprivation tenth
          </text>
          {/* Swatch legend, 1 to 10. */}
          <g transform={`translate(${-M.left},-26)`}>
            {Array.from({ length: 10 }, (_, d) => (
              <rect key={d} x={d * 16} width={14} height={6} rx={1.5} fill={decileColour(d + 1)} />
            ))}
            <text x={0} y={18} fontSize={9.5} fill={INK_3}>
              1 most deprived
            </text>
            <text x={158} y={18} textAnchor="end" fontSize={9.5} fill={INK_3}>
              10 least
            </text>
          </g>
          {y.ticks(6).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={w} stroke={LINE} opacity={0.8} />
              <text x={-10} dy="0.32em" textAnchor="end" fontSize={10.5} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}
          {[0, index.stall, index.now].map((i) => (
            <text key={i} x={x(i)} y={h + 24} textAnchor="middle" fontSize={10.5} fill={INK_3}>
              {periods[i].replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")}
            </text>
          ))}
          {rows.map((values, d) => {
            const edge = d === 0 || d === 9
            return (
              <path
                key={d}
                d={line(values) ?? ""}
                fill="none"
                stroke={decileColour(d + 1)}
                strokeWidth={edge ? 2.75 : 1.25}
                opacity={edge ? 1 : 0.6}
                pathLength={1}
                strokeDasharray="1 1"
                style={{
                  strokeDashoffset: active ? 0 : 1,
                  transition: `stroke-dashoffset 1400ms ${EASE} ${active ? d * 50 : 0}ms`,
                }}
              />
            )
          })}
          <g style={{ opacity: active ? 1 : 0, transition: "opacity 500ms 900ms" }}>
            {[0, 9].map((d) => (
              <text key={d} x={w + 10} y={y(rows[d][index.now] as number)} dy="0.32em" fontSize={11.5} fontWeight={600} fill={INK}>
                {narrow ? formatYears(rows[d][index.now]) : d === 0 ? "Most deprived" : "Least deprived"}
                {narrow ? null : (
                  <tspan fill={INK_3} fontWeight={400}>
                    {" "}
                    {formatYears(rows[d][index.now])}
                  </tspan>
                )}
              </text>
            ))}
            {[index.stall, index.now].map((i) => {
              const top = y(rows[9][i] as number)
              const bottom = y(rows[0][i] as number)
              return (
                <g key={i}>
                  <line x1={x(i)} x2={x(i)} y1={top + 5} y2={bottom - 5} stroke={INK} strokeWidth={1.25} />
                  <line x1={x(i) - 4} x2={x(i) + 4} y1={top + 5} y2={top + 5} stroke={INK} strokeWidth={1.25} />
                  <line x1={x(i) - 4} x2={x(i) + 4} y1={bottom - 5} y2={bottom - 5} stroke={INK} strokeWidth={1.25} />
                  <text
                    x={x(i) - 8}
                    y={(top + bottom) / 2}
                    dy="0.32em"
                    textAnchor="end"
                    fontSize={12}
                    fontWeight={700}
                    fill={INK}
                    stroke={PAPER}
                    strokeWidth={4}
                    paintOrder="stroke"
                  >
                    {formatYears(gapSeries[i])} yrs
                  </text>
                </g>
              )
            })}
          </g>
          {hover !== null && active ? (
            <g className="pointer-events-none">
              <line x1={x(hover)} x2={x(hover)} y1={0} y2={h} stroke={INK} opacity={0.25} />
              {rows.map((values, d) =>
                values[hover] === null ? null : (
                  <circle key={d} cx={x(hover)} cy={y(values[hover] as number)} r={3} fill={decileColour(d + 1)} stroke={PAPER} strokeWidth={1.5} />
                )
              )}
            </g>
          ) : null}
        </g>
      </svg>
      {hover !== null && active ? (
        <div
          className="pointer-events-none absolute z-10 w-[9.5rem] rounded-xl border border-line bg-white px-3 py-2 shadow-[0_16px_40px_-20px_rgba(17,19,21,0.5)]"
          style={{ left: Math.min(width - 170, M.left + x(hover) + 14), top: M.top }}
        >
          <p className="mono text-[11px] font-semibold text-ink">{periods[hover].replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")}</p>
          <ol className="mono mt-1 space-y-px text-[10.5px]">
            {rows.map((values, d) => (
              <li key={d} className="flex items-center gap-1.5 text-ink-2">
                <span className="h-1.5 w-2.5 rounded-sm" style={{ background: decileColour(d + 1) }} />
                <span>{d + 1}</span>
                <span className="ml-auto text-ink">{formatYears(values[hover])}</span>
              </li>
            ))}
          </ol>
          <p className="mono mt-1 border-t border-line pt-1 text-[10.5px] text-ink">Gap {formatYears(gapSeries[hover])}</p>
        </div>
      ) : null}
    </div>
  )
}

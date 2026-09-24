"use client"

import { useState } from "react"
import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { formatYears } from "@/lib/explorer/format"
import type { PackedPoint } from "@/lib/explorer/types"
import { FEMALE, INK, INK_3, LINE, MALE } from "@/lib/story/palette"

const M = { top: 16, right: 56, bottom: 28, left: 32 }
const H = 240

/** One sex: area line with its 95% band, nation and UK behind it. */
export function AreaTrend({
  sex,
  periods,
  series,
  nation,
  uk,
  nationName,
  name,
  domain,
}: {
  sex: "male" | "female"
  periods: string[]
  series: PackedPoint[]
  nation: (number | null)[]
  uk: (number | null)[]
  nationName: string
  name: string
  domain: [number, number]
}) {
  const [ref, { width }] = useSize<HTMLDivElement>({ width: 480, height: H })
  const [hover, setHover] = useState<number | null>(null)
  const colour = sex === "male" ? MALE : FEMALE
  const w = width - M.left - M.right
  const h = H - M.top - M.bottom
  const x = d3.scaleLinear().domain([0, periods.length - 1]).range([0, w])
  const y = d3.scaleLinear().domain(domain).range([h, 0])
  const line = d3
    .line<number | null>()
    .defined((v) => v !== null)
    .x((_, i) => x(i))
    .y((v) => y(v as number))
  const band = d3
    .area<PackedPoint>()
    .defined((p) => p[1] !== null && p[2] !== null)
    .x((_, i) => x(i))
    .y0((p) => y(p[1] as number))
    .y1((p) => y(p[2] as number))
  const own = series.map((p) => p[0])
  const last = periods.length - 1
  const at = hover ?? last

  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: colour }} />
          {sex === "male" ? "Men" : "Women"}
        </p>
        <p className="text-xs tabular text-ink-3">
          {periods[at].replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")}:{" "}
          <span className="font-medium text-ink">{formatYears(own[at])}</span> · {nationName}{" "}
          {formatYears(nation[at])}
        </p>
      </div>
      <svg
        width={width}
        height={H}
        className="chart block touch-none"
        role="img"
        aria-label={`${sex === "male" ? "Male" : "Female"} life expectancy in ${name}, ${nationName} and the UK`}
        onPointerMove={(e) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left - M.left
          setHover(Math.max(0, Math.min(last, Math.round(x.invert(px)))))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <g transform={`translate(${M.left},${M.top})`}>
          {y.ticks(4).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={w} stroke={LINE} opacity={0.7} />
              <text x={-8} dy="0.32em" textAnchor="end" fontSize={10} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}
          {[0, last].map((i) => (
            <text key={i} x={x(i)} y={h + 18} textAnchor={i === 0 ? "start" : "end"} fontSize={10} fill={INK_3}>
              {periods[i].replace(/^(\d{4}) to \d{2}(\d{2})$/, "$1–$2")}
            </text>
          ))}
          <path d={line(uk) ?? ""} fill="none" stroke="#bdbcb5" strokeWidth={1.25} />
          <path d={line(nation) ?? ""} fill="none" stroke={INK_3} strokeWidth={1.25} strokeDasharray="3 3" />
          <path d={band(series) ?? ""} fill={colour} opacity={0.14} />
          <path d={line(own) ?? ""} fill="none" stroke={colour} strokeWidth={2.25} strokeLinejoin="round" />
          <line x1={x(at)} x2={x(at)} y2={h} stroke={INK} opacity={hover === null ? 0 : 0.25} />
          {own[at] !== null ? (
            <circle cx={x(at)} cy={y(own[at] as number)} r={4} fill={colour} stroke="#f4f4f0" strokeWidth={2} />
          ) : null}
          <text x={w + 8} y={y(own[last] ?? 0)} dy="0.32em" fontSize={11} fontWeight={600} fill={INK}>
            {formatYears(own[last])}
          </text>
          <text x={w + 8} y={y(nation[last] ?? 0) + (Math.abs((nation[last] ?? 0) - (own[last] ?? 0)) < 0.6 ? 12 : 0)} dy="0.32em" fontSize={10} fill={INK_3}>
            {formatYears(nation[last])}
          </text>
        </g>
      </svg>
    </div>
  )
}

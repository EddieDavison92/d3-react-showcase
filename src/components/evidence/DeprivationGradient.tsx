"use client"

import { useState } from "react"
import * as d3 from "d3"
import { useWidth } from "@/components/explorer/use-width"
import type { DecileRow } from "@/lib/explorer/evidence"
import { formatYears } from "@/lib/explorer/format"

const HEIGHT = 240
const MARGIN = { top: 12, right: 60, bottom: 40, left: 34 }
export const SEX_COLOURS = { Male: "#0f766e", Female: "#7c3aed" } as const

/** Mean life expectancy by deprivation tenth, one line per sex. */
export function DeprivationGradient({ rows }: { rows: DecileRow[] }) {
  const [ref, width] = useWidth<HTMLDivElement>(640)
  const [hover, setHover] = useState<number | null>(null)
  const innerW = Math.max(60, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
  const x = d3.scalePoint<number>().domain(rows.map((r) => r.decile)).range([0, innerW]).padding(0.3)
  const vals = rows.flatMap((r) => [r.male, r.female]).filter((v): v is number => v !== null)
  const y = d3
    .scaleLinear()
    .domain(d3.extent(vals) as [number, number])
    .nice(4)
    .range([innerH, 0])

  const series = (["Male", "Female"] as const).map((sex) => ({
    sex,
    colour: SEX_COLOURS[sex],
    points: rows.map((r) => ({ decile: r.decile, v: sex === "Male" ? r.male : r.female })),
  }))
  const line = d3
    .line<{ decile: number; v: number | null }>()
    .defined((d) => d.v !== null)
    .x((d) => x(d.decile) ?? 0)
    .y((d) => y(d.v as number))

  return (
    <div ref={ref} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label="Mean life expectancy at birth by deprivation tenth, male and female"
        onPointerLeave={() => setHover(null)}
      >
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(4).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="#eef0f3" />
              <text x={-6} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[10px] tabular-nums">
                {t}
              </text>
            </g>
          ))}
          {rows.map((r) => (
            <text
              key={r.decile}
              x={x(r.decile)}
              y={innerH + 16}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] tabular-nums"
            >
              {r.decile}
            </text>
          ))}
          <text x={0} y={innerH + 34} className="fill-slate-500 text-[11px]">
            ← Most deprived
          </text>
          <text x={innerW} y={innerH + 34} textAnchor="end" className="fill-slate-500 text-[11px]">
            Least deprived →
          </text>
          {series.map((s) => (
            <g key={s.sex}>
              <path d={line(s.points) ?? ""} fill="none" stroke={s.colour} strokeWidth={2} />
              {s.points.map((p) =>
                p.v === null ? null : (
                  <circle
                    key={p.decile}
                    cx={x(p.decile)}
                    cy={y(p.v)}
                    r={hover === p.decile ? 5 : 3.5}
                    fill={s.colour}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )
              )}
              <text
                x={(x(10) ?? 0) + 8}
                y={y(s.points[9]?.v ?? 0)}
                dy="0.32em"
                className="text-[11px] font-medium"
                fill="#334155"
              >
                {s.sex}
              </text>
            </g>
          ))}
          {rows.map((r) => (
            <rect
              key={r.decile}
              x={(x(r.decile) ?? 0) - x.step() / 2}
              width={x.step()}
              height={innerH}
              fill="transparent"
              onPointerEnter={() => setHover(r.decile)}
            />
          ))}
        </g>
      </svg>
      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md"
          style={{ left: Math.min(width - 140, MARGIN.left + (x(hover) ?? 0) + 12) }}
        >
          <p className="font-medium text-slate-900">Tenth {hover}</p>
          <p className="text-slate-500">{rows[hover - 1].n} local authorities</p>
          {series.map((s) => (
            <p key={s.sex} className="mt-0.5 flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ background: s.colour }} />
              {s.sex}
              <span className="ml-auto pl-3 font-medium tabular-nums text-slate-900">
                {formatYears(s.points[hover - 1].v)}
              </span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  )
}

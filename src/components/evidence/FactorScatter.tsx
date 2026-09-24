"use client"

import { useMemo, useState } from "react"
import * as d3 from "d3"
import { useWidth } from "@/components/explorer/use-width"
import { formatIndicator, type Fit, type Indicator, type Pair } from "@/lib/explorer/evidence"
import { formatYears } from "@/lib/explorer/format"

const HEIGHT = 380
const MARGIN = { top: 16, right: 16, bottom: 44, left: 40 }
const HIGHLIGHT = "#0f766e"

export function FactorScatter({
  indicator,
  points,
  model,
  selected,
  yLabel,
  onSelect,
}: {
  indicator: Indicator
  points: Pair[]
  model: Fit | null
  selected: string | null
  yLabel: string
  onSelect: (code: string) => void
}) {
  const [ref, width] = useWidth<HTMLDivElement>(640)
  const [hover, setHover] = useState<Pair | null>(null)
  const innerW = Math.max(60, width - MARGIN.left - MARGIN.right)
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom

  const x = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(d3.extent(points, (p) => p.x) as [number, number])
        .nice()
        .range([0, innerW]),
    [innerW, points]
  )
  const y = useMemo(
    () =>
      d3
        .scaleLinear()
        .domain(d3.extent(points, (p) => p.y) as [number, number])
        .nice()
        .range([innerH, 0]),
    [innerH, points]
  )
  const delaunay = useMemo(
    () => d3.Delaunay.from(points, (p) => x(p.x), (p) => y(p.y)),
    [points, x, y]
  )

  const focus = points.find((p) => p.code === selected) ?? null
  const [x0, x1] = x.domain()

  const nearest = (event: React.MouseEvent<SVGRectElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const px = event.clientX - rect.left
    const py = event.clientY - rect.top
    const i = delaunay.find(px, py)
    const p = points[i]
    if (!p) return null
    return Math.hypot(x(p.x) - px, y(p.y) - py) < 24 ? p : null
  }

  return (
    <div ref={ref} className="relative">
      <svg width={width} height={HEIGHT} role="img" aria-label={`${indicator.label} against ${yLabel}, ${points.length} areas`}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(5).map((t) => (
            <g key={`y${t}`} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="#eef0f3" />
              <text x={-6} dy="0.32em" textAnchor="end" className="fill-slate-500 text-[10px] tabular-nums">
                {t}
              </text>
            </g>
          ))}
          {x.ticks(6).map((t) => (
            <text
              key={`x${t}`}
              x={x(t)}
              y={innerH + 16}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] tabular-nums"
            >
              {formatIndicator(t, { ...indicator, decimals: Number.isInteger(t) ? 0 : 1 })}
            </text>
          ))}
          <line y1={innerH} y2={innerH} x2={innerW} stroke="#cbd5e1" />
          <text x={innerW} y={innerH + 36} textAnchor="end" className="fill-slate-600 text-[11px]">
            {indicator.label}
            {indicator.unit !== "%" && indicator.unit !== "score" ? ` (${indicator.unit})` : ""} →
          </text>
          <text x={4} y={-4} className="fill-slate-600 text-[11px]">
            ↑ {yLabel}
          </text>
          {points.map((p) => (
            <circle
              key={p.code}
              cx={x(p.x)}
              cy={y(p.y)}
              r={3}
              fill="#94a3b8"
              fillOpacity={0.55}
            />
          ))}
          {model ? (
            <line
              x1={x(x0)}
              x2={x(x1)}
              y1={y(model.intercept + model.slope * x0)}
              y2={y(model.intercept + model.slope * x1)}
              stroke="#0f172a"
              strokeWidth={1.5}
              strokeOpacity={0.7}
            />
          ) : null}
          {hover && hover.code !== focus?.code ? (
            <circle cx={x(hover.x)} cy={y(hover.y)} r={5} fill="#334155" stroke="#fff" strokeWidth={2} />
          ) : null}
          {focus ? (
            <g>
              <circle cx={x(focus.x)} cy={y(focus.y)} r={6} fill={HIGHLIGHT} stroke="#fff" strokeWidth={2} />
              <text
                x={x(focus.x) + (x(focus.x) > innerW - 120 ? -10 : 10)}
                y={y(focus.y)}
                dy="0.32em"
                textAnchor={x(focus.x) > innerW - 120 ? "end" : "start"}
                className="text-[12px] font-semibold"
                fill="#0f172a"
                stroke="#fff"
                strokeWidth={3}
                paintOrder="stroke"
              >
                {focus.name}
              </text>
            </g>
          ) : null}
          <rect
            width={innerW}
            height={innerH}
            fill="transparent"
            className="cursor-pointer"
            onPointerMove={(event) => setHover(nearest(event))}
            onPointerLeave={() => setHover(null)}
            onClick={(event) => {
              const p = nearest(event)
              if (p) onSelect(p.code)
            }}
          />
        </g>
      </svg>
      {hover ? (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-md"
          style={{
            left: Math.min(width - 190, MARGIN.left + x(hover.x) + 12),
            top: Math.max(0, MARGIN.top + y(hover.y) - 56),
          }}
        >
          <p className="font-medium text-slate-900">{hover.name}</p>
          <p className="mt-0.5 text-slate-600">
            {yLabel}{" "}
            <span className="font-medium tabular-nums text-slate-900">{formatYears(hover.y)}</span>
          </p>
          <p className="text-slate-600">
            {indicator.label}{" "}
            <span className="font-medium tabular-nums text-slate-900">
              {formatIndicator(hover.x, indicator)}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

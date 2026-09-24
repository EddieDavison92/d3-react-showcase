"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import { useWidth } from "@/components/explorer/use-width"
import { CanvasDots } from "@/components/story/CanvasDots"
import { useTween } from "@/components/story/use-tween"
import { formatIndicator, type Fit, type Indicator, type Pair } from "@/lib/explorer/evidence"
import { formatYears } from "@/lib/explorer/format"

const HEIGHT = 380
const MARGIN = { top: 16, right: 16, bottom: 44, left: 40 }
const HIGHLIGHT = "#111315"

export function FactorScatter({
  indicator,
  points,
  model,
  selected,
  yLabel,
  colour,
  yDomain,
  onSelect,
}: {
  indicator: Indicator
  points: Pair[]
  model: Fit | null
  selected: string | null
  yLabel: string
  colour: string
  /** Fixed y range, so switching sex moves the dots rather than the axis. */
  yDomain?: [number, number]
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
        .domain(yDomain ?? (d3.extent(points, (p) => p.y) as [number, number]))
        .nice()
        .range([innerH, 0]),
    [innerH, points, yDomain]
  )
  const delaunay = useMemo(
    () => d3.Delaunay.from(points, (p) => x(p.x), (p) => y(p.y)),
    [points, x, y]
  )

  const focus = points.find((p) => p.code === selected) ?? null
  const [x0, x1] = x.domain()
  const fitEnds = useMemo(
    () => (model ? [model.intercept + model.slope * x0, model.intercept + model.slope * x1] : null),
    [model, x0, x1]
  )
  const dots = useMemo(
    () => points.map((p) => ({ key: p.code, x: MARGIN.left + x(p.x), y: MARGIN.top + y(p.y) })),
    [points, x, y]
  )

  // Hover is paused while dots glide to new positions, so it can't pick a dot at its destination.
  const moving = useRef(0)
  useEffect(() => {
    moving.current = performance.now() + 780
  }, [dots])

  const nearest = (event: React.MouseEvent<SVGRectElement>) => {
    if (performance.now() < moving.current) return null
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
      <div className="pointer-events-none absolute left-0 top-0" style={{ width, height: HEIGHT }}>
        <CanvasDots points={dots} width={width} height={HEIGHT} colour={colour} radius={3} alpha={0.35} />
      </div>
      <svg className="chart relative" width={width} height={HEIGHT} role="img" aria-label={`${indicator.label} against ${yLabel}, ${points.length} areas`}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {y.ticks(5).map((t) => (
            <g key={`y${t}`} transform={`translate(0,${y(t)})`}>
              <line x2={innerW} stroke="#e7e6e1" />
              <text x={-6} dy="0.32em" textAnchor="end" fontSize={10.5} fill="#62666d">
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
              fontSize={10.5} fill="#62666d"
            >
              {formatIndicator(t, { ...indicator, decimals: Number.isInteger(t) ? 0 : 1 })}
            </text>
          ))}
          <line y1={innerH} y2={innerH} x2={innerW} stroke="#d9d8d2" />
          <text x={innerW} y={innerH + 36} textAnchor="end" fontSize={10.5} fill="#3f4349">
            {indicator.label}
            {indicator.unit !== "%" && indicator.unit !== "score" ? ` (${indicator.unit})` : ""} →
          </text>
          <text x={4} y={-4} fontSize={10.5} fill="#3f4349">
            ↑ {yLabel}
          </text>
          {fitEnds ? <FitLine ends={fitEnds} x0={x(x0)} x1={x(x1)} y={y} /> : null}
          {hover && hover.code !== focus?.code ? (
            <circle cx={x(hover.x)} cy={y(hover.y)} r={5} fill="#111315" stroke="#f4f4f0" strokeWidth={2} />
          ) : null}
          {focus ? (
            <g
              style={{
                transform: `translate(${x(focus.x)}px, ${y(focus.y)}px)`,
                transition: "transform 750ms cubic-bezier(0.65,0,0.25,1)",
              }}
            >
              <circle r={6} fill={HIGHLIGHT} stroke="#f4f4f0" strokeWidth={2} />
              <text
                x={x(focus.x) > innerW - 120 ? -10 : 10}
                y={0}
                dy="0.32em"
                textAnchor={x(focus.x) > innerW - 120 ? "end" : "start"}
                fontSize={12} fontWeight={600}
                fill="#111315"
                stroke="#f4f4f0"
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
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-[0_12px_32px_-16px_rgba(17,19,21,0.45)]"
          style={{
            left: Math.min(width - 190, MARGIN.left + x(hover.x) + 12),
            top: Math.max(0, MARGIN.top + y(hover.y) - 56),
          }}
        >
          <p className="font-medium text-ink">{hover.name}</p>
          <p className="mt-0.5 text-ink-2">
            {yLabel}{" "}
            <span className="font-medium tabular text-ink">{formatYears(hover.y)}</span>
          </p>
          <p className="text-ink-2">
            {indicator.label}{" "}
            <span className="font-medium tabular text-ink">
              {formatIndicator(hover.x, indicator)}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

/** Fit line easing between sexes and measures; only this re-renders per frame. */
function FitLine({
  ends,
  x0,
  x1,
  y,
}: {
  ends: number[]
  x0: number
  x1: number
  y: d3.ScaleLinear<number, number>
}) {
  const [a, b] = useTween(ends, 750)
  return <line x1={x0} x2={x1} y1={y(a)} y2={y(b)} stroke="#111315" strokeWidth={1.5} strokeOpacity={0.7} />
}

"use client"

import { useEffect, useMemo, useRef } from "react"
import * as d3 from "d3"
import { compactPeriod } from "@/lib/explorer/format"
import type { PackedPoint } from "@/lib/explorer/types"

type Series = {
  code: string
  name: string
  colour: string
  points: PackedPoint[]
}

export function PeriodScrub({
  periods,
  year,
  onYear,
}: {
  periods: string[]
  year: string
  onYear: (year: string) => void
}) {
  if (periods.length <= 1) return null
  const yearIndex = Math.max(0, periods.indexOf(year))
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {compactPeriod(periods[0])}
      </span>
      <input
        type="range"
        min={0}
        max={periods.length - 1}
        value={yearIndex}
        onChange={(event) => onYear(periods[Number(event.target.value)])}
        className="h-11 min-h-11 w-full accent-teal-800"
        aria-label="Period scrub"
        aria-valuetext={compactPeriod(periods[yearIndex])}
      />
      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
        {compactPeriod(periods[periods.length - 1])}
      </span>
      <span className="hidden shrink-0 text-xs font-medium tabular-nums sm:inline">
        {compactPeriod(year)}
      </span>
    </div>
  )
}

export function SeriesPanel({
  periods,
  series,
  year,
  onYear,
  onAddCompare,
  onRemoveCompare,
  canCompare,
  emphasiseCi,
  compareUi = true,
}: {
  periods: string[]
  series: Series[]
  year: string
  unit: string
  onYear: (year: string) => void
  onAddCompare: () => void
  onRemoveCompare: (code: string) => void
  canCompare: boolean
  emphasiseCi?: boolean
  compareUi?: boolean
}) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const yearIndex = Math.max(0, periods.indexOf(year))

  const extent = useMemo(() => {
    const vals: number[] = []
    for (const item of series) {
      for (const [value, lci, uci] of item.points) {
        if (value !== null) vals.push(value)
        if (lci !== null) vals.push(lci)
        if (uci !== null) vals.push(uci)
      }
    }
    if (!vals.length) return [0, 1] as const
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const pad = (max - min) * 0.08 || 1
    return [min - pad, max + pad] as const
  }, [series])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const root = d3.select(svg)
    root.selectAll("*").remove()
    const width = svg.clientWidth || 480
    const height = 200
    const margin = { top: 12, right: 12, bottom: 28, left: 36 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3
      .scalePoint<string>()
      .domain(periods)
      .range([0, innerW])
      .padding(0.2)
    const y = d3.scaleLinear().domain(extent).nice().range([innerH, 0])

    const g = root
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    g.append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(periods.filter((_, i) => i === 0 || i === periods.length - 1 || i === yearIndex))
          .tickFormat((d) => compactPeriod(String(d)))
      )
      .selectAll("text")
      .attr("font-size", 10)

    g.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .selectAll("text")
      .attr("font-size", 10)

    const markerX = x(year)
    if (markerX !== undefined) {
      g.append("line")
        .attr("x1", markerX)
        .attr("x2", markerX)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#0f766e")
        .attr("stroke-dasharray", "3,3")
        .attr("stroke-width", 1)
    }

    for (const item of series) {
      const line = d3
        .line<PackedPoint>()
        .defined((d) => d[0] !== null)
        .x((_, i) => x(periods[i]) ?? 0)
        .y((d) => y(d[0] as number))

      if (item.points.some((d) => d[1] !== null && d[2] !== null)) {
        const area = d3
          .area<PackedPoint>()
          .defined((d) => d[1] !== null && d[2] !== null)
          .x((_, i) => x(periods[i]) ?? 0)
          .y0((d) => y(d[1] as number))
          .y1((d) => y(d[2] as number))
        g.append("path")
          .attr("d", area(item.points) ?? "")
          .attr("fill", item.colour)
          .attr("opacity", emphasiseCi ? 0.28 : 0.15)
      }

      g.append("path")
        .attr("d", line(item.points) ?? "")
        .attr("fill", "none")
        .attr("stroke", item.colour)
        .attr("stroke-width", 2)

      item.points.forEach((point, i) => {
        if (point[0] === null) return
        g.append("circle")
          .attr("cx", x(periods[i]) ?? 0)
          .attr("cy", y(point[0]))
          .attr("r", periods[i] === year ? 4 : 2.2)
          .attr("fill", item.colour)
          .style("cursor", "pointer")
          .on("click", () => onYear(periods[i]))
      })
    }
  }, [emphasiseCi, extent, periods, series, year, yearIndex, onYear])

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Timeline
          </p>
          {series.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              {series.map((item) => item.name).join(" · ")}
            </p>
          ) : null}
        </div>
        {compareUi ? (
          <div className="flex flex-col items-end gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Compare
            </p>
            <button
              type="button"
              disabled={!canCompare}
              onClick={onAddCompare}
              className="min-h-11 rounded-md border px-3 text-sm disabled:opacity-40"
            >
              Add to compare
            </button>
          </div>
        ) : null}
      </div>
      <svg ref={svgRef} className="w-full min-w-0" height={200} />
      {compareUi && series.length > 1 ? (
        <div className="flex flex-wrap gap-1">
          {series.slice(1).map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => onRemoveCompare(item.code)}
              className="min-h-11 rounded-full border px-3 text-xs"
              style={{ borderColor: item.colour, color: item.colour }}
            >
              {item.name} ×
            </button>
          ))}
        </div>
      ) : compareUi ? (
        <p className="text-xs text-muted-foreground">Up to two extra areas.</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Male and female series — Male − Female (derived), not a persons estimate.
        </p>
      )}
    </div>
  )
}

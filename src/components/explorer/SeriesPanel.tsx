"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  hud,
  onDragging,
}: {
  periods: string[]
  year: string
  onYear: (year: string) => void
  hud?: string | null
  onDragging?: (dragging: boolean) => void
}) {
  const [dragging, setDragging] = useState(false)
  if (periods.length <= 1) return null
  const yearIndex = Math.max(0, periods.indexOf(year))
  const fill = `${(yearIndex / (periods.length - 1)) * 100}%`

  const setDrag = (next: boolean) => {
    setDragging(next)
    onDragging?.(next)
  }

  return (
    <div className="space-y-0.5">
      {dragging && hud ? (
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {compactPeriod(year)} · {hud}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {compactPeriod(periods[0])}
        </span>
        <input
          type="range"
          min={0}
          max={periods.length - 1}
          value={yearIndex}
          onChange={(event) => onYear(periods[Number(event.target.value)])}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            setDrag(true)
          }}
          onPointerUp={() => setDrag(false)}
          onPointerCancel={() => setDrag(false)}
          className="period-scrub min-h-11 w-full"
          style={{ ["--fill" as string]: fill }}
          aria-label="Period scrub"
          aria-valuetext={compactPeriod(periods[yearIndex])}
        />
        <span className="w-12 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
          {compactPeriod(periods[periods.length - 1])}
        </span>
      </div>
      {!dragging ? (
        <p className="text-center text-[11px] font-medium tabular-nums">{compactPeriod(year)}</p>
      ) : null}
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
  heading,
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
  heading?: string
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

    // Quiet axes: hairline grid, no domain rules, muted labels — the lines carry the story.
    const xAxis = g
      .append("g")
      .attr("transform", `translate(0,${innerH})`)
      .call(
        d3
          .axisBottom(x)
          .tickSize(0)
          .tickPadding(10)
          .tickValues(periods.filter((_, i) => i === 0 || i === periods.length - 1 || i === yearIndex))
          .tickFormat((d) => compactPeriod(String(d)))
      )
    const yAxis = g
      .append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-innerW).tickPadding(8))
    for (const axis of [xAxis, yAxis]) {
      axis.select(".domain").remove()
      axis.selectAll("text").attr("font-size", 11).attr("fill", "#64748b")
    }
    yAxis.selectAll(".tick line").attr("stroke", "#e2e8f0")
    g.append("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", innerH)
      .attr("y2", innerH)
      .attr("stroke", "#cbd5e1")

    const markerX = x(year)
    if (markerX !== undefined) {
      g.append("line")
        .attr("x1", markerX)
        .attr("x2", markerX)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#94a3b8")
        .attr("stroke-dasharray", "2,3")
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
          .attr("opacity", emphasiseCi ? 0.28 : 0.16)
      }

      g.append("path")
        .attr("d", line(item.points) ?? "")
        .attr("fill", "none")
        .attr("stroke", item.colour)
        .attr("stroke-width", 2.5)

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
    <div className="flex h-full min-h-0 flex-col gap-2 pt-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {heading ?? series[0]?.name ?? "Series"}
          </p>
          {series.length > 1 ? (
            <p className="text-xs text-muted-foreground">
              {series.map((item) => item.name).join(" · ")}
            </p>
          ) : null}
        </div>
        {compareUi ? (
          <button
            type="button"
            disabled={!canCompare}
            onClick={onAddCompare}
            title="Keep this area on the chart, then pick another — up to two extra areas."
            className="min-h-11 rounded-md px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 lg:min-h-9"
          >
            + Add to compare
          </button>
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

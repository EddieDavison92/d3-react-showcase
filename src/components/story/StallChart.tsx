"use client"

import { useState } from "react"
import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { formatSigned, formatYears } from "@/lib/explorer/format"
import { FEMALE, INK, INK_3, LINE, MALE, PAPER } from "@/lib/story/palette"
import type { StoryData } from "@/lib/story/data"

const EASE = "cubic-bezier(0.65,0,0.25,1)"

/** UK life expectancy since 2001–03, revealed in three steps. */
export function StallChart({ data, step }: { data: StoryData; step: number }) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const narrow = width < 560
  const M = { top: 56, right: narrow ? 96 : 168, bottom: 48, left: 40 }
  const { periods, index, stall } = data
  const w = Math.max(10, width - M.left - M.right)
  const h = Math.max(10, height - M.top - M.bottom)
  const x = d3.scaleLinear().domain([0, periods.length - 1]).range([0, w])
  const y = d3.scaleLinear().domain([75, 86]).range([h, 0])
  // Last period visible at each step.
  const shownTo = step >= 2 ? index.now : step >= 1 ? index.precovid : index.stall

  const segment = (values: (number | null)[], from: number, to: number) =>
    d3
      .line<number>()
      .x((i) => x(i))
      .y((i) => y(values[i] as number))
      .curve(d3.curveMonotoneX)(d3.range(from, to + 1)) ?? ""

  const sexes = [
    { key: "male" as const, label: "Men", colour: MALE, s: stall.male, side: 1 },
    { key: "female" as const, label: "Women", colour: FEMALE, s: stall.female, side: -1 },
  ]
  const segments: [number, number, number][] = [
    [index.start, index.stall, 0],
    [index.stall, index.precovid, 1],
    [index.precovid, index.now, 2],
  ]
  const months = (v: number) => `${formatSigned(Math.round(v * 12 * 10) / 10)} months a year`
  // Clear of the line across the label's whole width: above it for women, below for men.
  const clearOf = (values: (number | null)[], from: number, to: number, side: number, text: string) => {
    const mid = (from + to) / 2
    const half = (text.length * 6.2) / 2 + 6
    const lo = Math.max(from, Math.floor(x.invert(x(mid) - half)))
    const hi = Math.min(to, Math.ceil(x.invert(x(mid) + half)))
    const ys = d3.range(lo, hi + 1).map((i) => y(values[i] as number))
    return side < 0 ? Math.min(...ys) - 12 : Math.max(...ys) + 20
  }
  const hoverIndex = hover !== null && hover <= shownTo ? hover : null

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg
        width={width}
        height={height}
        className="chart"
        role="img"
        aria-label="UK life expectancy at birth, men and women, 2001–03 to 2022–24"
        onPointerMove={(e) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left - M.left
          setHover(Math.max(0, Math.min(periods.length - 1, Math.round(x.invert(px)))))
        }}
        onPointerLeave={() => setHover(null)}
      >
        <g transform={`translate(${M.left},${M.top})`}>
          <text x={-M.left} y={-30} fontSize={10.5} fill={INK_3}>
            UK, life expectancy at birth (years)
          </text>
          {y.ticks(6).map((t) => (
            <g key={t} transform={`translate(0,${y(t)})`}>
              <line x2={w} stroke={LINE} opacity={0.8} />
              <text x={-10} dy="0.32em" textAnchor="end" fontSize={10.5} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}
          {[0, index.stall, index.precovid, index.now].map((i) => (
            <text key={i} x={x(i)} y={h + 24} textAnchor="middle" fontSize={10.5} fill={i <= shownTo ? INK_3 : LINE}>
              {short(periods[i])}
            </text>
          ))}

          {/* Where gains slowed. */}
          <g style={{ opacity: step >= 1 ? 1 : 0, transition: "opacity 600ms" }}>
            <line x1={x(index.stall)} x2={x(index.stall)} y1={-14} y2={h} stroke={INK} strokeDasharray="2 3" opacity={0.5} />
            <text x={x(index.stall) + 6} y={-6} fontSize={10.5} fill={INK}>
              Gains slow
            </text>
          </g>

          {/* COVID window. */}
          <g style={{ opacity: step >= 2 ? 1 : 0, transition: "opacity 600ms" }}>
            <rect x={x(index.precovid + 1)} width={x(index.now - 1) - x(index.precovid + 1)} y={-14} height={h + 14} fill={INK} opacity={0.045} />
            <text x={(x(index.precovid + 1) + x(index.now - 1)) / 2} y={-20} textAnchor="middle" fontSize={10.5} fill={INK_3}>
              COVID-19
            </text>
          </g>

          {sexes.map(({ key, colour, label, s, side }) => {
            const preText = months(s.pre)
            const postText = months(s.post)
            const endValue = s.values[shownTo] as number
            return (
              <g key={key}>
                {segments.map(([from, to, at]) => (
                  <path
                    key={at}
                    d={segment(s.values, from, to)}
                    fill="none"
                    stroke={colour}
                    strokeWidth={2.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    pathLength={1}
                    strokeDasharray="1 1"
                    style={{ strokeDashoffset: step >= at ? 0 : 1, transition: `stroke-dashoffset 1100ms ${EASE}` }}
                  />
                ))}
                {s.values.map((v, i) =>
                  v === null ? null : (
                    <circle
                      key={i}
                      cx={x(i)}
                      cy={y(v)}
                      r={hoverIndex === i ? 4.5 : 2.2}
                      fill={colour}
                      stroke={PAPER}
                      strokeWidth={hoverIndex === i ? 2 : 0}
                      style={{ opacity: i <= shownTo ? 1 : 0, transition: `opacity 400ms ${i <= shownTo ? 700 : 0}ms` }}
                    />
                  )
                )}

                {/* Pace of each stretch. */}
                <text
                  x={x((index.start + index.stall) / 2)}
                  y={clearOf(s.values, index.start, index.stall, side, preText)}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill={colour}
                  style={{ opacity: step === 0 ? 1 : step === 1 ? 0.35 : 0, transition: "opacity 600ms" }}
                >
                  {preText}
                </text>
                <text
                  x={x((index.stall + index.precovid) / 2)}
                  y={clearOf(s.values, index.stall, index.precovid, side, postText)}
                  textAnchor="middle"
                  fontSize={10.5}
                  fontWeight={600}
                  fill={colour}
                  style={{ opacity: step === 1 ? 1 : 0, transition: "opacity 600ms" }}
                >
                  {postText}
                </text>

                {/* The earlier pace extended. A projection, labelled as one. */}
                <g style={{ opacity: step >= 2 ? 1 : 0, transition: "opacity 700ms 500ms" }}>
                  <line
                    x1={x(index.stall)}
                    y1={y(s.values[index.stall] as number)}
                    x2={x(index.now)}
                    y2={y(s.trendNow)}
                    stroke={colour}
                    strokeWidth={1.5}
                    strokeDasharray="4 5"
                    opacity={0.75}
                  />
                  <circle cx={x(index.now)} cy={y(s.trendNow)} r={3.5} fill={PAPER} stroke={colour} strokeWidth={1.5} />
                  <text x={x(index.now) + 10} y={y(s.trendNow)} dy="0.32em" fontSize={10.5} fill={colour}>
                    {formatYears(s.trendNow)}
                    {narrow ? "" : " on 2001–13 trend"}
                  </text>
                  <line x1={x(index.now) + 4} x2={x(index.now) + 4} y1={y(s.trendNow) + 7} y2={y(s.now) - 7} stroke={colour} opacity={0.45} />
                </g>

                {/* End label rides the end of the drawn line. */}
                <g
                  style={{
                    transform: `translate(${x(shownTo) + 10}px, ${y(endValue)}px)`,
                    transition: `transform 1100ms ${EASE}`,
                  }}
                >
                  <text dy="0.32em" fontSize={12} fontWeight={600} fill={INK} stroke={PAPER} strokeWidth={4} paintOrder="stroke">
                    {label} <tspan fill={colour}>{formatYears(endValue)}</tspan>
                  </text>
                </g>
              </g>
            )
          })}

          {hoverIndex !== null ? (
            <g className="pointer-events-none">
              <line x1={x(hoverIndex)} x2={x(hoverIndex)} y1={0} y2={h} stroke={INK} opacity={0.25} />
              <text x={x(hoverIndex)} y={h + 40} textAnchor="middle" fontSize={10.5} fill={INK}>
                {short(periods[hoverIndex])}: men {formatYears(stall.male.values[hoverIndex])} · women{" "}
                {formatYears(stall.female.values[hoverIndex])}
              </text>
            </g>
          ) : null}
        </g>
      </svg>
    </div>
  )
}

function short(period: string): string {
  const m = period.match(/^(\d{4}) to (\d{4})$/)
  return m ? `${m[1]}–${m[2].slice(2)}` : period
}

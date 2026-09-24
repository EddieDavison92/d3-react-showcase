"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import * as d3 from "d3"
import { SexToggle } from "@/components/story/SexToggle"
import { useInView } from "@/components/story/use-in-view"
import { useTween } from "@/components/story/use-tween"
import { formatIndicator } from "@/lib/explorer/evidence"
import { formatSigned } from "@/lib/explorer/format"
import { FEMALE, INK, INK_3, LINE, MALE } from "@/lib/story/palette"
import type { StoryData } from "@/lib/story/data"

const W = 280
const H = 180
const M = { top: 10, right: 18, bottom: 24, left: 30 }

type Factor = StoryData["factors"][number]

/** One small scatter per circumstance. Order and axes stay fixed across sexes so only the dots move. */
export function FactorGrid({ data }: { data: StoryData }) {
  const [sex, setSex] = useState<"male" | "female">("male")
  const [ref, seen] = useInView<HTMLDivElement>(0.12)
  const factors = useMemo(() => [...data.factors].sort((a, b) => a.male.r - b.male.r), [data.factors])
  const now = data.index.now
  const y = useMemo(() => {
    const ys = data.areas.flatMap((a) => [a.male[now], a.female[now]]).filter((v): v is number => v !== null)
    return d3
      .scaleLinear()
      .domain([Math.floor(d3.min(ys)!), Math.ceil(d3.max(ys)!)])
      .range([H - M.bottom, M.top])
  }, [data.areas, now])

  return (
    <div ref={ref}>
      <div className="flex justify-end">
        <SexToggle value={sex} onChange={setSex} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {factors.map((f, k) => (
          <Panel key={f.indicator.key} factor={f} areas={data.areas} now={now} sex={sex} y={y} seen={seen} order={k} />
        ))}
      </div>
    </div>
  )
}

function Panel({
  factor,
  areas,
  now,
  sex,
  y,
  seen,
  order,
}: {
  factor: Factor
  areas: StoryData["areas"]
  now: number
  sex: "male" | "female"
  y: d3.ScaleLinear<number, number>
  seen: boolean
  order: number
}) {
  const { indicator } = factor
  const x = useMemo(() => {
    const xs = factor.x.filter((v): v is number => v !== null)
    return d3.scaleLinear().domain(d3.extent(xs) as [number, number]).nice(4).range([M.left, W - M.right])
  }, [factor])
  const { pts, codes } = useMemo(() => {
    const pts: [number, number][] = []
    const codes: string[] = []
    areas.forEach((a, i) => {
      const fx = factor.x[i]
      const ly = a[sex][now]
      if (fx === null || ly === null) return
      pts.push([fx, ly])
      codes.push(a.code)
    })
    return { pts, codes }
  }, [areas, factor, now, sex])
  const line = useMemo(() => {
    const mx = d3.mean(pts, (p) => p[0])!
    const my = d3.mean(pts, (p) => p[1])!
    const slope = d3.sum(pts, (p) => (p[0] - mx) * (p[1] - my)) / d3.sum(pts, (p) => (p[0] - mx) ** 2)
    const [x0, x1] = x.domain()
    return [x0, my + slope * (x0 - mx), x1, my + slope * (x1 - mx)]
  }, [pts, x])
  const [lx0, ly0, lx1, ly1, r] = useTween([...line, factor[sex].r], 750)
  const colour = sex === "male" ? MALE : FEMALE
  const england = factor.england

  return (
    <Link
      href={`/evidence?factor=${indicator.key}&sex=${sex}`}
      className="group -m-3 block rounded-2xl p-3 transition-colors hover:bg-white/80"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-ink">{indicator.short}</h3>
        <span className="display text-3xl text-ink">
          <span className="mono mr-1 text-xs font-normal italic text-ink-3">r</span>
          {formatSigned(r, 2)}
        </span>
      </div>
      <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-line/70">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-700 ease-out"
          style={{ width: seen ? `${Math.abs(r) * 100}%` : "0%", transitionDelay: seen ? `${order * 60}ms` : "0ms" }}
        />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="chart mt-2 w-full" role="img" aria-label={`${indicator.label} against life expectancy, r = ${factor[sex].r.toFixed(2)}`}>
        {y.ticks(3).map((t) => (
          <g key={t} transform={`translate(0,${y(t)})`}>
            <line x1={M.left} x2={W - M.right} stroke={LINE} opacity={0.8} />
            <text x={M.left - 6} dy="0.32em" textAnchor="end" fontSize={9} fill={INK_3}>
              {t}
            </text>
          </g>
        ))}
        {x.ticks(4).map((t) => (
          <text key={t} x={x(t)} y={H - 7} textAnchor="middle" fontSize={9} fill={INK_3}>
            {formatIndicator(t, { ...indicator, decimals: 0 })}
          </text>
        ))}
        {england !== null ? (
          <g transform={`translate(${x(england)},0)`}>
            <line y1={M.top} y2={H - M.bottom} stroke={INK} strokeDasharray="2 3" opacity={0.5} />
            <text y={M.top - 2} x={3} fontSize={8.5} fill={INK_3}>
              Eng
            </text>
          </g>
        ) : null}
        <g style={{ opacity: seen ? 1 : 0, transition: `opacity 800ms ${order * 60}ms` }}>
          {pts.map((p, i) => (
            <circle
              key={codes[i]}
              r={1.9}
              fill={colour}
              fillOpacity={0.4}
              style={{
                transform: `translate(${x(p[0])}px, ${y(p[1])}px)`,
                transition: "transform 750ms cubic-bezier(0.65,0,0.25,1), fill 750ms ease",
              }}
            />
          ))}
          <line x1={x(lx0)} x2={x(lx1)} y1={y(ly0)} y2={y(ly1)} stroke={INK} strokeWidth={1.6} strokeLinecap="round" />
        </g>
      </svg>
      <p className="mt-1 text-[11px] leading-snug text-ink-3">
        {indicator.label}, {indicator.period}. England {formatIndicator(england, indicator)}.
      </p>
    </Link>
  )
}

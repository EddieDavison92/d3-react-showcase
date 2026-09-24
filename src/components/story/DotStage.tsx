"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import * as d3 from "d3"
import { useSize } from "@/components/story/use-size"
import { formatSigned, formatYears } from "@/lib/explorer/format"
import { dodge, hexPositions, type Point } from "@/lib/story/layout"
import {
  clamp01,
  decileColour,
  DIVERGING,
  divergingColour,
  INK,
  INK_3,
  leColour,
  LINE,
  NO_DATA,
  PAPER,
} from "@/lib/story/palette"
import type { StoryArea } from "@/lib/story/data"

export type DotLayout = "map" | "rank" | "decile" | "change"
/** gap = difference from the UK figure; change = since the base period. */
export type DotColour = "gap" | "le" | "decile" | "change"
export type Sex = "male" | "female"

export type DotScene = {
  layout: DotLayout
  colour: DotColour
  sex: Sex
  /** Codes to ring and label. */
  highlight?: string[]
  /** Codes to ring without a label. */
  rings?: string[]
  /** Show a mean tick per deprivation row. */
  means?: boolean
}

const PAD = { top: 36, right: 24, bottom: 44, left: 20 }
const LE_DOMAIN: Record<Sex, [number, number]> = { male: [72, 85], female: [76, 88] }
const CHANGE_DOMAIN: [number, number] = [-2.5, 2.5]
/** Colours saturate here: ±1.5 years for change, ±4.5 years for the gap to the UK. */
const CHANGE_SPAN = 1.5
const GAP_SPAN = 4.5
const NON_ENGLAND_ROW = 10
const LABEL_LIFT = 46
/** Opening: one dot every INTRO_STEP ms, lowest life expectancy first. */
const INTRO_STEP = 13
const INTRO_POP = 650

export function DotStage({
  areas,
  scene,
  now,
  base,
  reference,
  intro = false,
  className,
}: {
  areas: StoryArea[]
  scene: DotScene
  now: number
  base: number
  /** UK life expectancy for the gap colouring and the rank reference line. */
  reference: { male: number; female: number }
  /** Play the opening: dots arrive one by one, lowest to highest. */
  intro?: boolean
  className?: string
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const [phase, setPhase] = useState<"wait" | "play" | "done">(intro ? "wait" : "done")
  const { width, height, measured } = size
  const { layout, colour, sex, highlight = [], rings = [], means } = scene
  const narrow = width < 520
  const rowLabelW = narrow ? 36 : 112
  const uk = reference[sex]

  // Lowest to highest, for the opening sequence and its readout.
  const order = useMemo(
    () =>
      areas
        .map((a, i) => ({ i, v: a[sex][now] }))
        .sort((a, b) => (a.v ?? Infinity) - (b.v ?? Infinity))
        .map((d) => d.i),
    [areas, sex, now]
  )
  const rankOf = useMemo(() => {
    const out = new Array<number>(areas.length)
    order.forEach((i, k) => (out[i] = k))
    return out
  }, [areas.length, order])

  useEffect(() => {
    if (phase !== "wait" || !measured) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = requestAnimationFrame(() => setPhase(reduce ? "done" : "play"))
    return () => cancelAnimationFrame(id)
  }, [phase, measured])

  useEffect(() => {
    if (phase !== "play") return
    const timer = window.setTimeout(() => setPhase("done"), order.length * INTRO_STEP + INTRO_POP + 150)
    return () => window.clearTimeout(timer)
  }, [phase, order.length])

  // Leaving the map mid-sequence ends it.
  const stage = layout === "map" ? phase : "done"
  const done = stage === "done"

  const value = (a: StoryArea) => a[sex][now]
  const change = (a: StoryArea) => {
    const v = a[sex][now]
    const b = a[sex][base]
    return v === null || b === null ? null : v - b
  }

  // On phones the map sits under the legend, leaving the lower screen for captions.
  const hex = useMemo(() => hexPositions(areas, width, height, narrow ? 8 : 16, narrow ? 48 : undefined), [areas, width, height, narrow])
  const r = Math.max(2.4, Math.min(hex.radius * 0.72, width / 110, 9))
  const rowed = layout === "decile" || layout === "change"

  const plot = {
    left: PAD.left + (rowed ? rowLabelW : 0),
    right: width - PAD.right,
    top: PAD.top + (layout === "change" ? 44 : rowed ? 12 : 0),
    bottom: height - PAD.bottom,
  }
  const x = useMemo(() => {
    const domain = layout === "change" ? CHANGE_DOMAIN : LE_DOMAIN[sex]
    return d3.scaleLinear().domain(domain).range([plot.left, plot.right]).clamp(true)
  }, [layout, plot.left, plot.right, sex])
  const rows = NON_ENGLAND_ROW + 1
  const rowH = (plot.bottom - plot.top) / rows
  const rowY = (row: number) => plot.top + rowH * (row + 0.5)

  const positions: (Point | null)[] = useMemo(() => {
    if (layout === "map") return hex.points
    if (layout === "rank") {
      return dodge(
        areas.map((a) => (value(a) === null ? null : x(value(a) as number))),
        r,
        (plot.top + plot.bottom) / 2,
        (plot.bottom - plot.top) / 2
      )
    }
    const out: (Point | null)[] = areas.map(() => null)
    for (let row = 0; row < rows; row += 1) {
      const members = areas
        .map((a, i) => ({ a, i }))
        .filter(({ a }) => (row === NON_ENGLAND_ROW ? a.decile === null : a.decile === row + 1))
      const xs = members.map(({ a }) => {
        const v = layout === "change" ? change(a) : value(a)
        return v === null ? null : x(v)
      })
      const placed = dodge(xs, r * 0.8, rowY(row), rowH / 2 - r)
      members.forEach(({ i }, k) => (out[i] = placed[k]))
    }
    return out
    // value/change close over sex, now and base, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, hex.points, layout, now, base, sex, x, r, rowH, plot.top, plot.bottom])

  const fill = (a: StoryArea) => {
    if (colour === "decile") return a.decile ? decileColour(a.decile) : NO_DATA
    if (colour === "change") {
      const c = change(a)
      return c === null ? NO_DATA : divergingColour(clamp01((c + CHANGE_SPAN) / (2 * CHANGE_SPAN)))
    }
    const v = value(a)
    if (v === null) return NO_DATA
    if (colour === "gap") return divergingColour(clamp01((v - uk + GAP_SPAN) / (2 * GAP_SPAN)))
    const [lo, hi] = LE_DOMAIN[sex]
    return leColour(clamp01((v - lo) / (hi - lo)))
  }

  const rowMeans = useMemo(() => {
    if (!means) return []
    return Array.from({ length: 10 }, (_, d) => {
      const vals = areas
        .filter((a) => a.decile === d + 1)
        .map((a) => (layout === "change" ? change(a) : value(a)))
        .filter((v): v is number => v !== null)
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas, layout, means, sex, now, base])

  // Dots fill their hex on the map, then shrink to pack into rows.
  const dot = layout === "map" ? hex.radius * 0.94 : layout === "rank" ? r : r * 0.8
  const hovered = hover !== null ? areas[hover] : null
  const hoverPos = hover !== null ? positions[hover] : null
  const ringSet = new Set([...rings, ...highlight])

  return (
    <div ref={ref} className={className ?? "relative h-full w-full"}>
      <svg width={width} height={height} className="chart absolute inset-0 overflow-visible" role="img" aria-label={ariaFor(scene)}>
        {/* Rank layout: value axis and the UK reference. */}
        <g className="transition-opacity duration-700" opacity={layout === "rank" ? 1 : 0}>
          {x.ticks(6).map((t) => (
            <g key={`r${t}`} transform={`translate(${x(t)},0)`}>
              <line y1={plot.top} y2={plot.bottom} stroke={LINE} opacity={0.7} />
              <text y={plot.bottom + 18} textAnchor="middle" fontSize={10.5} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}
          <g transform={`translate(${x(uk)},0)`}>
            <line y1={plot.top - 8} y2={plot.bottom} stroke={INK} strokeWidth={1} strokeDasharray="2 3" />
            <text y={plot.top - 14} textAnchor="middle" fontSize={10.5} fill={INK}>
              UK {formatYears(uk)}
            </text>
          </g>
          <text x={plot.right} y={plot.bottom + 36} textAnchor="end" fontSize={10.5} fill={INK_3}>
            {sex === "male" ? "Men" : "Women"}, life expectancy at birth →
          </text>
        </g>

        {/* Deprivation rows. */}
        <g className="transition-opacity duration-700" opacity={rowed ? 1 : 0}>
          <text x={PAD.left} y={plot.top - 14} fontSize={10.5} fill={INK_3}>
            {narrow ? "IMD tenth" : "Deprivation tenth (IMD 2025)"}
          </text>
          {Array.from({ length: rows }, (_, row) => (
            <g key={row} transform={`translate(0,${rowY(row)})`}>
              <line x1={plot.left} x2={plot.right} stroke={LINE} opacity={0.8} />
              <text x={PAD.left} dy="0.32em" fontSize={10.5} fill={row === NON_ENGLAND_ROW ? INK_3 : INK}>
                {rowLabel(row, narrow)}
              </text>
            </g>
          ))}
          {x.ticks(narrow ? 4 : 6).map((t) => (
            <text key={`t${t}`} x={x(t)} y={plot.bottom + 18} textAnchor="middle" fontSize={10.5} fill={INK_3}>
              {layout === "change" ? formatSigned(t, 0) : t}
            </text>
          ))}
          <line
            x1={x(0)}
            x2={x(0)}
            y1={plot.top - 4}
            y2={plot.bottom}
            stroke={INK}
            opacity={layout === "change" ? 0.6 : 0}
            className="transition-opacity duration-700"
          />
          <text x={plot.right} y={plot.bottom + 36} textAnchor="end" fontSize={10.5} fill={INK_3}>
            {layout === "change" ? "Change since 2011–13, years →" : `${sex === "male" ? "Men" : "Women"}, life expectancy at birth →`}
          </text>
        </g>

        {/* The dots. */}
        <g onPointerLeave={() => setHover(null)}>
          {areas.map((a, i) => {
            const p = positions[i]
            const shown = p !== null
            const px = p?.x ?? width / 2
            const py = p?.y ?? height / 2
            const dimmed = rowed && a.decile === null
            const delay = (px / Math.max(1, width)) * 260
            const arrive = rankOf[i] * INTRO_STEP
            return (
              <circle
                key={a.code}
                className="mark"
                r={1}
                fill={fill(a)}
                opacity={stage === "wait" || !shown ? 0 : dimmed ? 0.4 : 1}
                style={{
                  transform: `translate(${px}px, ${py}px) scale(${stage === "wait" ? 0 : dot})`,
                  ...(stage === "play"
                    ? {
                        transition: `transform ${INTRO_POP}ms cubic-bezier(0.34,1.56,0.64,1) ${arrive}ms, opacity 160ms linear ${arrive}ms`,
                      }
                    : { ["--delay" as string]: `${Math.round(hover === null ? delay : 0)}ms` }),
                }}
                onPointerEnter={() => setHover(i)}
              />
            )
          })}
        </g>

        {/* Row means, with values on the first and last rows. */}
        {means && rowed
          ? rowMeans.map((m, d) =>
              m === null ? null : (
                <g key={d} className="mark pointer-events-none" style={{ transform: `translate(${x(m)}px, ${rowY(d)}px)` }}>
                  <line y1={-rowH * 0.44} y2={rowH * 0.44} stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
                  {d === 0 || d === 9 ? (
                    <text x={6} y={-rowH * 0.3} fontSize={10.5} fontWeight={600} fill={INK} stroke={PAPER} strokeWidth={3} paintOrder="stroke">
                      {layout === "change" ? formatSigned(m) : formatYears(m)}
                    </text>
                  ) : null}
                </g>
              )
            )
          : null}

        {/* Rings, and leader lines for labelled areas; labels are HTML below. */}
        {areas.map((a, i) => {
          if (!ringSet.has(a.code)) return null
          const p = positions[i]
          if (!p) return null
          const labelled = highlight.includes(a.code)
          return (
            <g
              key={a.code}
              className="mark pointer-events-none"
              style={{ transform: `translate(${p.x}px, ${p.y}px)`, opacity: done ? 1 : 0 }}
            >
              <circle r={dot + (labelled ? 3.5 : 2)} fill="none" stroke={INK} strokeWidth={labelled ? 1.5 : 1} opacity={labelled ? 1 : 0.7} />
              {labelled ? <line y1={-dot - 4} y2={-LABEL_LIFT + 12} stroke={INK} strokeWidth={1} /> : null}
            </g>
          )
        })}
      </svg>

      <Legend colour={colour} layout={layout} uk={uk} narrow={narrow} hidden={!done} />
      {stage === "play" ? <IntroReadout areas={areas} order={order} sex={sex} now={now} narrow={narrow} /> : null}

      {highlight.map((code) => {
        const i = areas.findIndex((a) => a.code === code)
        const p = positions[i]
        if (i < 0 || !p) return null
        const a = areas[i]
        const v = layout === "change" ? change(a) : value(a)
        return (
          <div
            key={code}
            className="pointer-events-none absolute z-10 whitespace-nowrap rounded-full border border-ink/10 bg-white px-3 py-1 text-[13px] shadow-[0_6px_20px_-10px_rgba(17,19,21,0.4)] transition-[left,top,transform] duration-[1100ms] ease-[cubic-bezier(0.65,0,0.25,1)]"
            style={{
              left: Math.max(8, Math.min(width - 8, p.x)),
              top: p.y - LABEL_LIFT,
              transform: `translate(${p.x > width - 130 ? "-100%" : p.x < 130 ? "0" : "-50%"}, -50%)`,
              opacity: done ? 1 : 0,
            }}
          >
            <span className="font-semibold text-ink">{a.name}</span>{" "}
            <span className="mono text-xs text-ink-3">{layout === "change" ? formatSigned(v) : formatYears(v)}</span>
          </div>
        )
      })}

      {hovered && hoverPos ? (
        <div
          className="pointer-events-none absolute z-20 w-max max-w-[15rem] rounded-xl border border-line bg-white px-3.5 py-2.5 text-xs shadow-[0_16px_40px_-20px_rgba(17,19,21,0.5)]"
          style={{
            left: Math.max(4, Math.min(width - 190, hoverPos.x + 14)),
            top: Math.max(0, hoverPos.y - 76),
          }}
        >
          <p className="text-sm font-semibold text-ink">{hovered.name}</p>
          <dl className="mono mt-1.5 grid grid-cols-[auto_auto] gap-x-5 gap-y-0.5 text-[11px] text-ink-2">
            <dt>Men</dt>
            <dd className="text-right text-ink">{formatYears(hovered.male[now])}</dd>
            <dt>Women</dt>
            <dd className="text-right text-ink">{formatYears(hovered.female[now])}</dd>
            {layout === "change" ? (
              <>
                <dt>Since 2011–13</dt>
                <dd className="text-right text-ink">{formatSigned(change(hovered))}</dd>
              </>
            ) : null}
            {hovered.decile ? (
              <>
                <dt>IMD tenth</dt>
                <dd className="text-right text-ink">{hovered.decile} of 10</dd>
              </>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  )
}

/** Running readout during the opening: the value of the dot that just arrived. */
function IntroReadout({
  areas,
  order,
  sex,
  now,
  narrow,
}: {
  areas: StoryArea[]
  order: number[]
  sex: Sex
  now: number
  narrow: boolean
}) {
  const [k, setK] = useState(0)
  const start = useRef<number | null>(null)
  useEffect(() => {
    let frame = 0
    const loop = (t: number) => {
      start.current ??= t
      const next = Math.min(order.length - 1, Math.floor((t - start.current) / INTRO_STEP))
      setK(next)
      if (next < order.length - 1) frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [order.length])
  const a = areas[order[k]]
  const v = a?.[sex][now]
  return (
    <div className={"pointer-events-none absolute " + (narrow ? "left-2 top-0" : "left-4 top-6")} aria-hidden>
      <p className="kicker">Lowest to highest · {sex === "male" ? "men" : "women"}</p>
      <p className="display mt-1 text-5xl text-ink">{formatYears(v)}</p>
      <div className="mt-2 h-[2px] w-40 overflow-hidden rounded-full bg-line">
        <div className="h-full bg-ink" style={{ width: `${((k + 1) / order.length) * 100}%` }} />
      </div>
    </div>
  )
}

function Legend({
  colour,
  layout,
  uk,
  narrow,
  hidden,
}: {
  colour: DotColour
  layout: DotLayout
  uk: number
  narrow: boolean
  hidden?: boolean
}) {
  const show = (colour === "gap" || colour === "change") && !hidden
  const gap = colour === "gap"
  return (
    <div
      className={
        "pointer-events-none absolute w-56 transition-opacity duration-700 " +
        (layout === "change" ? "right-6 top-0" : narrow ? "left-2 top-0" : "left-4 top-6")
      }
      style={{ opacity: show ? 1 : 0, transform: show ? "none" : "translateY(6px)", transition: "opacity 700ms ease, transform 700ms ease" }}
      aria-hidden={!show}
    >
      <p className="kicker mb-1.5">{gap ? `Gap to UK average (${formatYears(uk)})` : "Change since 2011–13"}</p>
      <div className="flex h-2 overflow-hidden rounded-full">
        {DIVERGING.map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="mono mt-1 flex justify-between text-[10px] text-ink-3">
        <span>{gap ? `−${GAP_SPAN}` : `−${CHANGE_SPAN}`}</span>
        <span>0</span>
        <span>{gap ? `+${GAP_SPAN}` : `+${CHANGE_SPAN}`} yrs</span>
      </div>
      <div className="mt-0.5 flex justify-between text-[11px] text-ink-2">
        <span>{gap ? "Shorter" : "Fell"}</span>
        <span>{gap ? "Longer" : "Rose"}</span>
      </div>
    </div>
  )
}

function rowLabel(row: number, narrow: boolean): string {
  if (row === NON_ENGLAND_ROW) return narrow ? "W/S/NI" : "Wales, Scot., NI"
  if (narrow) return String(row + 1)
  if (row === 0) return "1 · most deprived"
  if (row === 9) return "10 · least"
  return String(row + 1)
}

function ariaFor(scene: DotScene): string {
  const who = scene.sex === "male" ? "male" : "female"
  switch (scene.layout) {
    case "map":
      return `Hex map of 359 UK local authorities coloured by ${who} life expectancy relative to the UK`
    case "rank":
      return `Local authorities arranged by ${who} life expectancy, with the UK figure marked`
    case "decile":
      return `English local authorities grouped by deprivation tenth, by ${who} life expectancy`
    case "change":
      return `Change in ${who} life expectancy since 2011–13 by deprivation tenth`
  }
}


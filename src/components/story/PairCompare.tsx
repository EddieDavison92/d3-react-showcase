"use client"

import { HIGH, LOW } from "@/components/story/PairLines"
import { COMPARE_GROUPS, type CompareRow } from "@/lib/story/compare"
import { cn } from "@/lib/utils"

/** Log scale of the ratio to England: ¼× to 3×. */
const MIN = 0.22
const MAX = 3
const pos = (ratio: number) => {
  const t = (Math.log(ratio) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN))
  // Rounded so server and client render the same style string.
  return Math.round(Math.max(0, Math.min(1, t)) * 100000) / 1000
}
const TICKS = [
  { v: 0.25, label: "¼×" },
  { v: 0.5, label: "½×" },
  { v: 1, label: "England" },
  { v: 2, label: "2×" },
]
const EASE = "cubic-bezier(0.65,0,0.25,1)"

const value = (row: CompareRow, v: number | null, flag: boolean) => {
  if (v === null || flag) return "n/a"
  const n = row.unit === "rate" ? Math.round(v).toLocaleString("en-GB") : v.toFixed(1)
  return row.unit === "%" ? `${n}%` : n
}

/**
 * Each measure as a ratio to England, one row per measure: the two places as
 * dots, joined. Groups light up in turn; earlier ones stay, dimmed.
 */
export function PairCompare({
  rows,
  names,
  step,
}: {
  rows: CompareRow[]
  names: { low: string; high: string }
  /** Group shown at full strength; earlier groups stay dimmed, later ones wait. Below 0 shows none. */
  step: number
}) {
  return (
    // Phones: pinned to the top, clear of the caption card.
    <div className="flex h-full flex-col justify-start pt-4 sm:justify-center sm:py-10">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-ink-2">
        <Key colour={LOW} label={names.low} />
        <Key colour={HIGH} label={names.high} />
        <span className="flex items-center gap-1.5 text-ink-3">
          <span className="h-3 border-l border-dashed border-ink/60" />
          England = 1×, log scale
        </span>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_3.25rem] gap-x-3 sm:grid-cols-[12.5rem_minmax(0,1fr)_3.75rem] sm:gap-x-4">
        <span className="hidden sm:block" />
        <div className="relative h-4">
          {TICKS.map((t) => (
            <span key={t.v} className="mono absolute -translate-x-1/2 text-[10px] text-ink-3" style={{ left: `${pos(t.v)}%` }}>
              {t.label}
            </span>
          ))}
        </div>
        <span className="mono justify-self-end whitespace-nowrap text-[10px] text-ink-3">
          <span className="sm:hidden">Ratio</span>
          <span className="hidden sm:inline">
            {names.low.split(" ")[0]} ÷ {names.high.split(" ")[0]}
          </span>
        </span>

        {COMPARE_GROUPS.map((group, g) => {
          const state = g === step ? "on" : g < step ? "past" : "next"
          return (
            // Phones show only the current group.
            <div
              key={group}
              className={cn(
                "col-span-full grid-cols-subgrid transition-opacity duration-700",
                state === "on" ? "grid" : "hidden sm:grid"
              )}
              style={{ opacity: state === "on" ? 1 : 0.32 }}
            >
              <p className="kicker col-span-full mb-1 mt-4 sm:mt-5">{group}</p>
              {rows
                .filter((r) => r.group === g)
                .map((row, i) => (
                  <Row key={row.key} row={row} shown={state !== "next"} delay={state === "on" ? i * 90 : 0} />
                ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Row({ row, shown, delay }: { row: CompareRow; shown: boolean; delay: number }) {
  const eng = row.england
  const lo = !row.lowFlag && row.low !== null && eng ? row.low / eng : null
  const hi = !row.highFlag && row.high !== null && eng ? row.high / eng : null
  const at = (r: number | null) => (shown && r !== null ? pos(r) : pos(1))
  const span = [at(lo), at(hi)].filter((_, k) => (k === 0 ? lo : hi) !== null)
  const left = Math.min(...span, pos(1))
  const right = Math.max(...span, pos(1))
  // A composite score has no meaningful ratio.
  const ratio = lo !== null && hi !== null && row.unit !== "score" ? row.low! / row.high! : null
  const move = `${900}ms ${EASE} ${delay}ms`

  return (
    <div className="col-span-full grid grid-cols-subgrid items-center py-[3px]">
      <p className="col-span-2 flex items-baseline justify-between gap-2 text-[12.5px] leading-tight text-ink sm:col-span-1 sm:block">
        <span>{row.label}</span>
        <span className="mono whitespace-nowrap text-[10.5px] text-ink-3 sm:mt-0.5 sm:block">
          <span style={{ color: LOW }}>{value(row, row.low, row.lowFlag)}</span>
          {" · "}
          <span style={{ color: HIGH }}>{value(row, row.high, row.highFlag)}</span>
          <span className="hidden sm:inline"> · {row.note}</span>
        </span>
      </p>
      <div className="relative h-6">
        <span className="absolute inset-y-0 border-l border-dashed border-ink/40" style={{ left: `${pos(1)}%` }} />
        <span
          className="absolute top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-ink/20"
          style={{ left: `${left}%`, width: `${right - left}%`, transition: `left ${move}, width ${move}` }}
        />
        {[
          { r: lo, colour: LOW },
          { r: hi, colour: HIGH },
        ].map(({ r, colour }) =>
          r === null ? null : (
            <span
              key={colour}
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper"
              style={{ left: `${at(r)}%`, background: colour, opacity: shown ? 1 : 0, transition: `left ${move}, opacity 300ms ${delay}ms` }}
            />
          )
        )}
      </div>
      <p
        className={cn("display text-right text-lg tabular-nums leading-none text-ink transition-opacity duration-500", !shown && "opacity-0")}
        style={{ transitionDelay: shown ? `${delay + 700}ms` : "0ms" }}
      >
        {ratio === null ? <span className="text-ink-4">–</span> : `${ratio.toFixed(1)}×`}
      </p>
    </div>
  )
}

function Key({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: colour }} />
      {label}
    </span>
  )
}

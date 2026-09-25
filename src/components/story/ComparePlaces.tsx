"use client"

import Link from "next/link"
import { useState } from "react"
import { PlaceSearch } from "@/components/story/PlaceSearch"
import { useTween } from "@/components/story/use-tween"
import { formatYears } from "@/lib/explorer/format"
import type { SearchableArea } from "@/lib/explorer/place-find"
import type { StoryArea } from "@/lib/story/data"
import { clamp01, divergingColour } from "@/lib/story/palette"

/** Same colours as the map: ±4.5 years from the UK figure saturates. */
const GAP_SPAN = 4.5

type Sex = "male" | "female"
export type Pair = { mine: string | null; other: string }

/**
 * Your area against another place. Both sit on a ruler spanning every place,
 * coloured as on the map, with the gap between them; the map marks the same two.
 */
export function ComparePlaces({
  areas,
  places,
  sex,
  now,
  pair,
  stand,
  uk,
  onChange,
}: {
  areas: StoryArea[]
  places: SearchableArea[]
  sex: Sex
  now: number
  pair: Pair
  /** Shown on the ruler until you pick your area. */
  stand: string
  /** UK life expectancy for this sex. */
  uk: number
  onChange: (pair: Pair) => void
}) {
  const [editing, setEditing] = useState<keyof Pair | null>(null)
  const byCode = (code: string | null) => areas.find((a) => a.code === code) ?? null
  const mine = byCode(pair.mine)
  const other = byCode(pair.other)
  const values = areas.map((a) => a[sex][now]).filter((v): v is number => v !== null)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const standIn = byCode(stand)
  const vMine = (mine ?? standIn)?.[sex][now] ?? null
  const vOther = other?.[sex][now] ?? null
  // Values roll and dots slide when either place or the sex changes.
  // The ruler's ends and UK mark move with them, so the dots never leave it mid-slide.
  const [a, b, lo, hi, ukAt] = useTween([vMine ?? min, vOther ?? min, min, max, uk], 800)
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100))
  const gap = vMine !== null && vOther !== null ? vMine - vOther : null
  const colourOf = (v: number | null) => (v === null ? "#8a8d92" : divergingColour(clamp01((v - uk + GAP_SPAN) / (2 * GAP_SPAN))))
  const child = sex === "male" ? "boy" : "girl"

  const slot = (key: keyof Pair, area: StoryArea | null, colour: string, placeholder: string) =>
    editing === key || !area ? (
      <div
        className="min-w-0 flex-1 basis-44"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEditing(null)
        }}
        onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
      >
        <PlaceSearch
          areas={places}
          size="sm"
          placeholder={placeholder}
          autoFocus={editing === key}
          onPick={(code) => {
            setEditing(null)
            onChange({ ...pair, [key]: code })
          }}
        />
      </div>
    ) : (
      <span className="inline-flex h-10 min-w-0 items-center rounded-full border border-line bg-white shadow-[0_1px_2px_rgba(17,19,21,0.04)]">
        <button
          type="button"
          onClick={() => setEditing(key)}
          className="flex h-full min-w-0 items-center gap-2 rounded-full pl-3.5 pr-3 text-sm transition-colors hover:bg-paper"
          aria-label={`Change ${area.name}`}
        >
          <span className="h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-500" style={{ background: colour }} />
          <span className="truncate font-medium text-ink">{area.name}</span>
        </button>
        {key === "mine" ? (
          <button
            type="button"
            onClick={() => onChange({ ...pair, mine: null })}
            className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper hover:text-ink"
            aria-label="Clear your area"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
              <path d="m3 3 6 6M9 3 3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        ) : null}
      </span>
    )

  return (
    <div className="mt-6 max-w-md animate-rise rounded-2xl border border-line bg-white/55 p-4 [animation-delay:420ms] sm:mt-8 sm:p-5">
      <p className="kicker">Compare your area</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {slot("mine", mine, colourOf(vMine), "Your area or postcode")}
        <span className="px-0.5 text-sm text-ink-3">vs</span>
        {slot("other", other, colourOf(vOther), "Another place")}
      </div>

      {/* Ruler: every place's range, with the two marked. */}
      <div className="relative mt-6 h-9" aria-hidden>
        <div className="absolute inset-x-0 top-4 h-px bg-ink/20" />
        <span className="absolute top-[11px] h-[11px] w-px bg-ink/50" style={{ left: `${pct(ukAt)}%` }} />
        <span className="mono absolute top-6 -translate-x-1/2 text-[10px] text-ink-3" style={{ left: `${pct(ukAt)}%` }}>
          UK
        </span>
        {gap !== null ? (
          <>
            <div
              className="absolute top-[15px] h-[3px] rounded-full bg-ink/70"
              style={{ left: `${Math.min(pct(a), pct(b))}%`, width: `${Math.abs(pct(a) - pct(b))}%` }}
            />
            <span
              className="mono absolute -top-1.5 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink"
              style={{ left: `${(pct(a) + pct(b)) / 2}%` }}
            >
              {formatYears(Math.abs(a - b))} yrs
            </span>
          </>
        ) : null}
        {[
          { v: b, colour: colourOf(b), on: true },
          { v: a, colour: colourOf(a), on: true },
        ].map((d, i) => (
          <span
            key={i}
            className="absolute top-[10.5px] h-3 w-3 -translate-x-1/2 rounded-full border border-ink/30 ring-2 ring-paper transition-[opacity,background-color] duration-500"
            style={{ left: `${pct(d.v)}%`, background: d.colour, opacity: d.on ? 1 : 0 }}
          />
        ))}
        <span className="mono absolute left-0 top-6 text-[10px] text-ink-3">{formatYears(lo)}</span>
        <span className="mono absolute right-0 top-6 text-[10px] text-ink-3">{formatYears(hi)} yrs</span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-2" aria-live="polite">
        {mine && other && gap !== null ? (
          <>
            A {child} born in <strong>{mine.name}</strong> can expect to live {formatYears(a)} years
            {Math.abs(gap) < 0.05
              ? `, the same as in ${other.name}.`
              : `, ${formatYears(Math.abs(gap))} ${gap < 0 ? "fewer" : "more"} than in ${other.name}.`}{" "}
            <Link href={`/area/${mine.code}`} className="link whitespace-nowrap">
              {mine.name} in full →
            </Link>
          </>
        ) : (
          <span className="text-ink-3">
            {standIn ? `Pick your area to take ${standIn.name}'s place, here and on the map.` : "Pick your area; the map will mark both places."}
          </span>
        )}
      </p>
    </div>
  )
}


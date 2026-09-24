"use client"

import { useEffect, useState } from "react"
import { compactPeriod } from "@/lib/explorer/format"

const STEP_MS = 650

export function PeriodScrub({
  periods,
  year,
  onYear,
  onDragging,
}: {
  periods: string[]
  year: string
  onYear: (year: string) => void
  onDragging?: (dragging: boolean) => void
}) {
  const [playing, setPlaying] = useState(false)
  const index = Math.max(0, periods.indexOf(year))
  const running = playing && index < periods.length - 1

  useEffect(() => {
    if (!running) return
    const timer = window.setTimeout(() => {
      if (index + 1 >= periods.length - 1) setPlaying(false)
      onYear(periods[index + 1])
    }, STEP_MS)
    return () => window.clearTimeout(timer)
  }, [index, onYear, periods, running])

  if (periods.length <= 1) return null
  const fill = `${(index / (periods.length - 1)) * 100}%`

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          if (running) return setPlaying(false)
          if (index >= periods.length - 1) onYear(periods[0])
          setPlaying(true)
        }}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900"
        aria-label={running ? "Pause" : "Play through periods"}
      >
        {running ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <rect x="2.5" y="2" width="2.5" height="8" rx="0.5" fill="currentColor" />
            <rect x="7" y="2" width="2.5" height="8" rx="0.5" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 12 12" className="ml-0.5 h-3 w-3" aria-hidden>
            <path d="M3 1.8v8.4L10 6z" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="w-16 shrink-0 whitespace-nowrap text-sm font-medium tabular-nums text-slate-900">
        {compactPeriod(periods[index])}
      </span>
      <input
        type="range"
        min={0}
        max={periods.length - 1}
        value={index}
        onChange={(event) => {
          setPlaying(false)
          onYear(periods[Number(event.target.value)])
        }}
        onPointerDown={() => onDragging?.(true)}
        onPointerUp={() => onDragging?.(false)}
        onPointerCancel={() => onDragging?.(false)}
        className="period-scrub h-8 min-w-0 flex-1"
        style={{ ["--fill" as string]: fill }}
        aria-label="Period"
        aria-valuetext={compactPeriod(periods[index])}
      />
    </div>
  )
}

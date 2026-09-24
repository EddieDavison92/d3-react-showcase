"use client"

import type { Indicator } from "@/lib/explorer/evidence"
import { cn } from "@/lib/utils"

export type CorrelationRow = { indicator: Indicator; r: number; n: number }

/** Correlation with life expectancy, as bars either side of zero. */
export function CorrelationBars({
  title,
  rows,
  selected,
  onSelect,
}: {
  title: string
  rows: CorrelationRow[]
  selected: string
  onSelect: (key: string) => void
}) {
  return (
    <div>
      <p className="kicker mb-2">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((row) => {
          const active = row.indicator.key === selected
          const width = `${Math.abs(row.r) * 50}%`
          return (
            <li key={row.indicator.key}>
              <button
                type="button"
                onClick={() => onSelect(row.indicator.key)}
                aria-pressed={active}
                className={cn(
                  "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,10rem)_2.75rem] items-center gap-3 rounded-lg px-2.5 py-1.5 text-left text-sm",
                  active ? "bg-white shadow-sm ring-1 ring-ink/5" : "hover:bg-white/60"
                )}
              >
                <span
                  title={row.indicator.label}
                  className={cn("truncate", active ? "font-medium text-ink" : "text-ink-2")}
                >
                  {row.indicator.short}
                </span>
                <span className="relative h-2.5" aria-hidden>
                  <span className="absolute inset-y-[-3px] left-1/2 w-px bg-ink/20" />
                  <span
                    className={cn(
                      "absolute inset-y-0 rounded-sm transition-[width,background-color] duration-700 ease-[cubic-bezier(0.65,0,0.25,1)]",
                      active ? "bg-ink" : "bg-ink/25"
                    )}
                    style={row.r < 0 ? { right: "50%", width } : { left: "50%", width }}
                  />
                </span>
                <span className="mono text-right text-[12px] text-ink">
                  {row.r >= 0 ? "+" : "−"}
                  {Math.abs(row.r).toFixed(2)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

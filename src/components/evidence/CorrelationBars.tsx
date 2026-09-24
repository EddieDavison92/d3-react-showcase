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
      <p className="mb-2 text-xs font-medium text-slate-500">{title}</p>
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
                  "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,10rem)_2.75rem] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm",
                  active ? "bg-teal-50" : "hover:bg-slate-50"
                )}
              >
                <span
                  title={row.indicator.label}
                  className={cn("truncate", active ? "font-medium text-slate-900" : "text-slate-700")}
                >
                  {row.indicator.short}
                </span>
                <span className="relative h-2.5" aria-hidden>
                  <span className="absolute inset-y-[-3px] left-1/2 w-px bg-slate-300" />
                  <span
                    className={cn(
                      "absolute inset-y-0 rounded-sm",
                      active ? "bg-teal-700" : "bg-slate-400"
                    )}
                    style={row.r < 0 ? { right: "50%", width } : { left: "50%", width }}
                  />
                </span>
                <span className="text-right tabular-nums text-slate-900">
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

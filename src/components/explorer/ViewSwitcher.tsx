"use client"

import type { KeyboardEvent } from "react"
import type { ViewId } from "@/lib/explorer/types"
import { VIEW_OPTIONS, viewNote } from "@/lib/explorer/views"
import { cn } from "@/lib/utils"

export function ViewSwitcher({
  value,
  onChange,
  options,
}: {
  value: ViewId
  onChange: (view: ViewId) => void
  options?: ViewId[]
}) {
  const shown = options
    ? VIEW_OPTIONS.filter((option) => options.includes(option.id))
    : VIEW_OPTIONS
  if (!shown.length) return null

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return
    event.preventDefault()
    const index = Math.max(0, shown.findIndex((option) => option.id === value))
    const next =
      event.key === "ArrowRight"
        ? shown[(index + 1) % shown.length]
        : shown[(index - 1 + shown.length) % shown.length]
    onChange(next.id)
  }

  return (
    <div className="min-w-0 space-y-1">
      <div
        className="flex flex-nowrap gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Map view"
        onKeyDown={move}
      >
        {shown.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.aria}
              title={option.aria}
              onClick={() => onChange(option.id)}
              className={cn(
                "h-9 min-h-9 min-w-[6.5rem] shrink-0 grow basis-0 whitespace-nowrap rounded-md border px-1.5 text-center text-[13px] font-medium md:h-8 md:min-h-8",
                selected
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">{viewNote(value)}</p>
    </div>
  )
}

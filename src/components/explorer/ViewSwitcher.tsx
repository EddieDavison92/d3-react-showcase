"use client"

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

  return (
    <div className="min-w-0 space-y-1">
      <div
        className="flex flex-nowrap gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Explore mode"
      >
        {shown.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "h-8 min-h-8 min-w-[6.5rem] shrink-0 grow basis-0 whitespace-nowrap rounded-md border px-1.5 text-center text-[11px] sm:h-9 sm:min-h-9 sm:text-xs",
                selected
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-input bg-background hover:bg-muted"
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

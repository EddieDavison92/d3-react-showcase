"use client"

import type { ViewId } from "@/lib/explorer/types"
import { VIEW_OPTIONS, viewNote } from "@/lib/explorer/views"
import { cn } from "@/lib/utils"

export function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewId
  onChange: (view: ViewId) => void
}) {
  return (
    <div className="space-y-1">
      <div
        className="flex flex-wrap gap-1"
        role="radiogroup"
        aria-label="Explore mode"
      >
        {VIEW_OPTIONS.map((option) => {
          const selected = value === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                "min-h-8 min-w-0 flex-1 basis-[5.2rem] rounded-md border px-1.5 py-1 text-center text-[11px] leading-tight sm:min-h-9 sm:text-xs",
                selected
                  ? "border-teal-800 bg-teal-800 text-white"
                  : "border-input bg-background hover:bg-muted"
              )}
            >
              <span className="sm:hidden">{option.shortLabel}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">{viewNote(value)}</p>
    </div>
  )
}

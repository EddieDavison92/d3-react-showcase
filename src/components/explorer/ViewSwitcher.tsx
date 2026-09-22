"use client"

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react"
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
  const rowRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState({ left: 0, width: 0 })

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const measure = () => {
      const selected = row.querySelector('[aria-checked="true"]') as HTMLElement | null
      if (!selected) return
      setPill({ left: selected.offsetLeft, width: selected.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [value, shown.length])

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
        ref={rowRef}
        className="relative flex flex-nowrap overflow-x-auto rounded-[10px] bg-slate-100/80 p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Map view"
        onKeyDown={move}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute top-0.5 bottom-0.5 rounded-md bg-teal-800 motion-safe:transition-[left,width] motion-safe:duration-150"
          style={{ left: pill.left, width: pill.width }}
        />
        {shown.map((option, index) => {
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
                "relative z-[1] h-9 min-h-9 min-w-[4.6rem] shrink-0 grow basis-0 whitespace-nowrap px-1.5 text-center text-[13px] font-medium md:h-8 md:min-h-8 md:min-w-[6.2rem]",
                index > 0 && !selected ? "border-l border-slate-200" : "border-l border-transparent",
                selected ? "text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="md:hidden">{option.shortLabel}</span>
              <span className="hidden md:inline">{option.label}</span>
            </button>
          )
        })}
      </div>
      <p className="text-[11px] leading-snug text-muted-foreground">{viewNote(value)}</p>
    </div>
  )
}

"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

/** Pill group for two to four exclusive options. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
}: {
  value: T
  options: { value: T; label: string; dot?: string }[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex h-9 shrink-0 rounded-full border border-line bg-paper-2 p-0.5",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition-colors",
              active ? "bg-white font-medium text-ink shadow-sm ring-1 ring-ink/5" : "text-ink-3 hover:text-ink-2"
            )}
          >
            {option.dot ? <span className="h-2 w-2 rounded-full" style={{ background: option.dot }} /> : null}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type Option<T> = { value: T; label: string; hint?: string }

/**
 * Listbox styled to match the site. The menu is portalled to the body (the
 * Atlas panels use backdrop blur, which would trap a fixed menu inside them)
 * and opens upwards when there's no room below.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [place, setPlace] = useState<{ left: number; width: number; top?: number; bottom?: number }>({ left: 0, width: 0 })
  const selected = Math.max(0, options.findIndex((o) => o.value === value))

  const openMenu = () => {
    const r = buttonRef.current?.getBoundingClientRect()
    if (!r) return
    const menuH = Math.min(440, options.length * (options.some((o) => o.hint) ? 56 : 38) + 10)
    const below = window.innerHeight - r.bottom
    setPlace(
      below < menuH + 12 && r.top > below
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6 }
        : { left: r.left, width: r.width, top: r.bottom + 6 }
    )
    setActive(selected)
    setOpen(true)
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) buttonRef.current?.focus()
  }

  const choose = (i: number) => {
    onChange(options[i].value)
    close()
  }

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!listRef.current?.contains(t) && !buttonRef.current?.contains(t)) setOpen(false)
    }
    const onMove = () => setOpen(false)
    document.addEventListener("pointerdown", onDown)
    window.addEventListener("resize", onMove)
    window.addEventListener("scroll", onMove, true)
    return () => {
      document.removeEventListener("pointerdown", onDown)
      window.removeEventListener("resize", onMove)
      window.removeEventListener("scroll", onMove, true)
    }
  }, [open])

  return (
    <div className={cn("relative block", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${options[selected]?.label}`}
        onClick={() => (open ? close(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            openMenu()
          }
        }}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-full border bg-white pl-3.5 pr-3 text-left text-sm text-ink transition",
          open ? "border-brand ring-4 ring-brand/10" : "border-line hover:border-ink/25"
        )}
      >
        <span className="truncate">{options[selected]?.label}</span>
        <svg aria-hidden viewBox="0 0 12 12" className={cn("h-3 w-3 shrink-0 text-ink-3 transition-transform", open && "rotate-180")}>
          <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
      {open
        ? createPortal(
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((i) => Math.min(options.length - 1, i + 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (e.key === "Home") {
              e.preventDefault()
              setActive(0)
            } else if (e.key === "End") {
              e.preventDefault()
              setActive(options.length - 1)
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              choose(active)
            } else if (e.key === "Escape") {
              e.preventDefault()
              close()
            } else if (e.key === "Tab") {
              setOpen(false)
            }
          }}
          style={{ left: place.left, width: Math.max(place.width, 220), top: place.top, bottom: place.bottom }}
          className="fixed z-[70] max-h-[440px] animate-[menu_140ms_ease-out] overflow-auto rounded-2xl border border-line bg-white p-1 shadow-[0_24px_48px_-20px_rgba(17,19,21,0.35)] outline-none"
        >
          {options.map((o, i) => {
            const isSelected = i === selected
            return (
              <li
                key={o.value}
                id={`${id}-${i}`}
                role="option"
                aria-selected={isSelected}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex cursor-pointer items-start justify-between gap-3 rounded-xl px-3 py-2 text-sm",
                  i === active ? "bg-paper" : ""
                )}
              >
                <span className="min-w-0">
                  <span className={cn("block", isSelected ? "font-medium text-ink" : "text-ink-2")}>{o.label}</span>
                  {o.hint ? <span className="mt-0.5 block text-xs leading-snug text-ink-3">{o.hint}</span> : null}
                </span>
                {isSelected ? (
                  <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-brand">
                    <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
              </li>
            )
          })}
        </ul>,
            document.body
          )
        : null}
    </div>
  )
}

/** Small caps label above a control or panel section. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("kicker", className)}>{children}</p>
}

"use client"

import { cn } from "@/lib/utils"

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex h-9 shrink-0 rounded-md bg-slate-100 p-0.5",
        disabled && "opacity-50"
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
              "rounded-[5px] px-3 text-sm motion-safe:transition-colors",
              active
                ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <label className={cn("relative inline-flex shrink-0", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-sm text-slate-900 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500"
      >
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </label>
  )
}

/** Uppercase caption above a control or panel section. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500",
        className
      )}
    >
      {children}
    </p>
  )
}

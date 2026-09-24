"use client"

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
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-9 w-full appearance-none rounded-full border border-line bg-white pl-3.5 pr-8 text-sm text-ink transition hover:border-ink/20 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg aria-hidden viewBox="0 0 12 12" className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-3">
        <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </label>
  )
}

/** Small caps label above a control or panel section. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("kicker", className)}>{children}</p>
}

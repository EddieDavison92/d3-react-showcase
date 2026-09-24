"use client"

import { cn } from "@/lib/utils"

/** Men / women switch with a sliding thumb. */
export function SexToggle({
  value,
  onChange,
  className,
}: {
  value: "male" | "female"
  onChange: (value: "male" | "female") => void
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Sex"
      className={cn("relative inline-grid h-9 grid-cols-2 rounded-full border border-line bg-paper-2 p-0.5 text-sm", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-white shadow-sm ring-1 ring-ink/5 transition-transform duration-300 ease-out"
        style={{ transform: value === "female" ? "translateX(100%)" : "none" }}
      />
      {(["male", "female"] as const).map((sex) => (
        <button
          key={sex}
          type="button"
          role="radio"
          aria-checked={value === sex}
          onClick={() => onChange(sex)}
          className={cn(
            "relative z-10 flex items-center justify-center gap-1.5 px-4 transition-colors",
            value === sex ? "font-medium text-ink" : "text-ink-3 hover:text-ink-2"
          )}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: sex === "male" ? "#2f6db5" : "#c27812" }} />
          {sex === "male" ? "Men" : "Women"}
        </button>
      ))}
    </div>
  )
}

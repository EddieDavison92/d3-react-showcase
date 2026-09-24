"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  lookupPostcode,
  postcodeKind,
  searchPlaces,
  type PlaceHit,
  type SearchableArea,
} from "@/lib/explorer/place-find"
import { cn } from "@/lib/utils"

/** Name or postcode search that opens an area report. */
export function PlaceSearch({
  areas,
  size = "lg",
  placeholder = "Search a place or postcode",
  onPick,
  className,
}: {
  areas: SearchableArea[]
  size?: "lg" | "sm"
  placeholder?: string
  onPick?: (code: string) => void
  className?: string
}) {
  const router = useRouter()
  const listId = useId()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [postcode, setPostcode] = useState<{ query: string; hits: PlaceHit[]; failed: boolean } | null>(null)

  const nameHits = useMemo(() => searchPlaces(areas, query, 6), [areas, query])
  const current = postcode?.query === query ? postcode : null
  const pending = postcodeKind(query) !== null && !current
  const hits = useMemo(() => {
    const seen = new Set<string>()
    return [...(current?.hits ?? []), ...nameHits].filter((h) => !seen.has(h.code) && seen.add(h.code)).slice(0, 7)
  }, [current, nameHits])
  const highlighted = Math.min(active, Math.max(0, hits.length - 1))

  useEffect(() => {
    if (!postcodeKind(query)) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      lookupPostcode(query, areas, {}, ctrl.signal)
        .then((found) => !ctrl.signal.aborted && setPostcode({ query, hits: found, failed: false }))
        .catch(() => !ctrl.signal.aborted && setPostcode({ query, hits: [], failed: true }))
    }, 250)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [areas, query])

  const pick = (hit: PlaceHit) => {
    setOpen(false)
    setQuery("")
    if (onPick) onPick(hit.code)
    else router.push(`/area/${hit.code}`)
  }

  const big = size === "lg"
  return (
    <div
      className={cn("relative", className)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-3", big ? "left-5 h-5 w-5" : "left-3 h-3.5 w-3.5")}
        >
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[highlighted] ? `${listId}-${hits[highlighted].code}` : undefined}
          aria-label="Search a place or postcode"
          placeholder={placeholder}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setActive((i) => Math.min(hits.length - 1, i + 1))
            } else if (e.key === "ArrowUp") {
              e.preventDefault()
              setActive((i) => Math.max(0, i - 1))
            } else if (e.key === "Enter" && hits[highlighted]) {
              e.preventDefault()
              pick(hits[highlighted])
            } else if (e.key === "Escape") {
              setOpen(false)
            }
          }}
          className={cn(
            "w-full rounded-full border border-line bg-white text-ink shadow-[0_1px_2px_rgba(17,19,21,0.04)] outline-none transition placeholder:text-ink-3 hover:border-ink/20 focus:border-brand focus:ring-4 focus:ring-brand/10",
            big ? "h-16 pl-14 pr-6 text-lg" : "h-10 pl-9 pr-4 text-base sm:text-sm"
          )}
        />
      </div>
      {open && query.trim().length >= 2 ? (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_24px_48px_-24px_rgba(17,19,21,0.35)]"
        >
          {hits.length ? (
            hits.map((hit, i) => (
              <button
                key={hit.code}
                id={`${listId}-${hit.code}`}
                type="button"
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(hit)}
                className={cn(
                  "flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left",
                  i === highlighted ? "bg-paper" : ""
                )}
              >
                <span className={cn("text-ink", big && "text-base")}>{hit.name}</span>
                {hit.via !== "name" ? <span className="text-2xs text-ink-3">postcode match</span> : null}
              </button>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-ink-3">
              {pending ? "Looking up postcode…" : current?.failed ? "Postcode lookup didn't respond. Try a name." : "No matching place."}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

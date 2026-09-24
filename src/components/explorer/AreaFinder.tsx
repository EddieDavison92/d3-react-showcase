"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { geoShort } from "@/lib/explorer/catalogue"
import {
  lookupPostcode,
  postcodeKind,
  searchPlaces,
  type PlaceHit,
  type SearchableArea,
} from "@/lib/explorer/place-find"
import type { GeoId } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const inputClass =
  "flex h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-base placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 md:text-sm"

export function AreaFinder({
  areas,
  value,
  geo,
  redirects,
  autoFocus,
  onPick,
}: {
  areas: SearchableArea[]
  value: string | null
  geo: GeoId
  redirects?: Record<string, { code: string; name: string }>
  autoFocus?: boolean
  onPick: (area: SearchableArea | null) => void
}) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const [postcode, setPostcode] = useState<{
    query: string
    hits: PlaceHit[]
    note: string | null
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = areas.find((area) => area.code === value) ?? null

  const nameHits = useMemo(() => searchPlaces(areas, query), [areas, query])
  const postcodeCurrent = postcode?.query === query ? postcode : null
  const postcodePending = postcodeKind(query) !== null && !postcodeCurrent
  const hits = useMemo(
    () => mergeHits(postcodeCurrent?.hits ?? [], nameHits),
    [postcodeCurrent, nameHits]
  )
  const highlighted = hits.length ? Math.min(active, hits.length - 1) : 0

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (!postcodeKind(query)) return
    const ctrl = new AbortController()
    const timer = window.setTimeout(() => {
      lookupPostcode(query, areas, redirects ?? {}, ctrl.signal)
        .then((found) => {
          if (ctrl.signal.aborted) return
          setPostcode({
            query,
            hits: found,
            note: found.length
              ? "Postcode lookup via postcodes.io."
              : "No area in this explorer for that postcode.",
          })
        })
        .catch((error: unknown) => {
          if (ctrl.signal.aborted) return
          console.warn("Postcode lookup failed", error)
          setPostcode({
            query,
            hits: [],
            note: "Postcode lookup didn't respond. Try the area name.",
          })
        })
    }, 280)
    return () => {
      ctrl.abort()
      window.clearTimeout(timer)
    }
  }, [areas, query, redirects])

  const shown = open ? query : (selected?.name ?? "")

  const pick = (area: SearchableArea | null) => {
    onPick(area)
    setQuery("")
    setActive(0)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        >
          <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <input
          ref={inputRef}
          className={cn(inputClass, value && "pr-10")}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[highlighted] ? `${listId}-${hits[highlighted].code}` : undefined}
          aria-label="Find an area"
          placeholder="Search area or postcode"
          value={shown}
          onFocus={(event) => {
            setOpen(true)
            setQuery("")
            setActive(0)
            event.currentTarget.select()
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault()
              setOpen(true)
              setActive((index) => Math.min(hits.length - 1, index + 1))
            } else if (event.key === "ArrowUp") {
              event.preventDefault()
              setActive((index) => Math.max(0, index - 1))
            } else if (event.key === "Enter") {
              event.preventDefault()
              const hit = hits[highlighted]
              if (hit) pick(hit)
            } else if (event.key === "Escape") {
              setOpen(false)
              setQuery("")
              setActive(0)
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-0.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label="Clear area"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => pick(null)}
          >
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label="Matching areas"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg"
        >
          {query.trim().length < 2 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Type at least two letters, or a postcode.
            </p>
          ) : postcodePending && hits.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Looking up that postcode…</p>
          ) : hits.length === 0 && !postcodeKind(query) ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No matching area.</p>
          ) : (
            hits.map((hit, index) => (
              <button
                key={`${hit.via}-${hit.code}`}
                id={`${listId}-${hit.code}`}
                type="button"
                role="option"
                aria-selected={index === highlighted}
                className={cn(
                  "flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left",
                  index === highlighted ? "bg-slate-100 text-foreground" : "hover:bg-slate-50"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(hit)}
              >
                <span className="min-w-0">
                  <span className="block truncate">{hit.name}</span>
                  {hit.via === "postcode-parent" ? (
                    <span className="block text-[11px] text-muted-foreground">
                      Contains that postcode
                    </span>
                  ) : null}
                </span>
                {hit.geo !== geo ? (
                  <span className="shrink-0 text-[11px] text-muted-foreground">{geoShort(hit.geo)}</span>
                ) : null}
              </button>
            ))
          )}
          {postcodeCurrent?.note ? (
            <p className="border-t px-3 py-2 text-[11px] leading-snug text-muted-foreground">
              {postcodeCurrent.note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function mergeHits(postcodeHits: PlaceHit[], nameHits: PlaceHit[]): PlaceHit[] {
  const seen = new Set<string>()
  const out: PlaceHit[] = []
  for (const hit of [...postcodeHits, ...nameHits]) {
    if (seen.has(hit.code)) continue
    seen.add(hit.code)
    out.push(hit)
    if (out.length >= 8) break
  }
  return out
}

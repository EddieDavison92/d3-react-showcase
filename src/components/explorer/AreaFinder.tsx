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
  "flex h-11 min-h-11 w-full rounded-md border border-input bg-background px-3 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"

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
  const [postcodeHits, setPostcodeHits] = useState<PlaceHit[]>([])
  const [postcodeNote, setPostcodeNote] = useState<string | null>(null)
  const [postcodePending, setPostcodePending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = areas.find((area) => area.code === value) ?? null

  const nameHits = useMemo(() => searchPlaces(areas, query), [areas, query])
  const hits = useMemo(() => mergeHits(postcodeHits, nameHits), [postcodeHits, nameHits])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!autoFocus) return
    inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const kind = postcodeKind(query)
    if (!kind) {
      setPostcodeHits([])
      setPostcodeNote(null)
      setPostcodePending(false)
      return
    }
    const ctrl = new AbortController()
    setPostcodePending(true)
    const timer = window.setTimeout(() => {
      lookupPostcode(query, areas, redirects ?? {}, ctrl.signal)
        .then((found) => {
          if (ctrl.signal.aborted) return
          setPostcodeHits(found)
          setPostcodeNote(
            found.length
              ? "Local area for that postcode, via postcodes.io — not an ONS service."
              : "No area in this explorer for that postcode."
          )
        })
        .catch((error: unknown) => {
          if (ctrl.signal.aborted) return
          console.warn("Postcode lookup failed", error)
          setPostcodeHits([])
          setPostcodeNote("Postcode lookup didn't respond. Try the area name.")
        })
        .finally(() => {
          if (!ctrl.signal.aborted) setPostcodePending(false)
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
    setOpen(false)
    setPostcodeHits([])
    setPostcodeNote(null)
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
        <input
          ref={inputRef}
          className={cn(inputClass, value && !open && "pr-10")}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${listId}-${hits[active].code}` : undefined}
          aria-label="Find an area"
          placeholder="Name or postcode"
          value={shown}
          onFocus={(event) => {
            setOpen(true)
            setQuery("")
            event.currentTarget.select()
          }}
          onChange={(event) => {
            setQuery(event.target.value)
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
              const hit = hits[active]
              if (hit) pick(hit)
            } else if (event.key === "Escape") {
              setOpen(false)
              setQuery("")
            }
          }}
        />
        {value ? (
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
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
          className="mt-1 max-h-64 w-full overflow-auto rounded-md border bg-white py-1 text-sm shadow-md"
        >
          {query.trim().length < 2 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Type a name or postcode. Searching all areas for this measure.
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
                aria-selected={index === active}
                className={cn(
                  "flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left",
                  index === active ? "bg-slate-100 text-foreground" : "hover:bg-slate-50"
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
          {postcodeNote ? (
            <p className="border-t px-3 py-2 text-[11px] leading-snug text-muted-foreground">
              {postcodeNote}
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

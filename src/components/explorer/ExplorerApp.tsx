"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CatalogueRail } from "@/components/explorer/CatalogueRail"
import { CompactFilterBar, FilterPanel } from "@/components/explorer/FilterPanel"
import { LinkedOverview } from "@/components/explorer/LinkedOverview"
import { WarningBanner } from "@/components/explorer/WarningBanner"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { familyOf, metricLabel } from "@/lib/explorer/catalogue"
import {
  areasForGeo,
  indexAreas,
  loadAvoidable,
  loadDeprivation,
  loadHle,
  loadLe,
  loadLookups,
} from "@/lib/explorer/data"
import { applyExplorerChange } from "@/lib/explorer/nesting"
import { DEFAULT_STATE, parseSearchParams, toSearchParams } from "@/lib/explorer/url-state"
import type {
  DeprivationFile,
  ExplorerState,
  ExplorerWarning,
  LookupsFile,
  MetricId,
  PackedFile,
} from "@/lib/explorer/types"

export function ExplorerApp() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [cutsOpen, setCutsOpen] = useState(false)
  const [le, setLe] = useState<PackedFile | null>(null)
  const [hle, setHle] = useState<PackedFile | null>(null)
  const [avoidable, setAvoidable] = useState<PackedFile | null>(null)
  const [deprivation, setDeprivation] = useState<DeprivationFile | null>(null)
  const [lookups, setLookups] = useState<LookupsFile | null>(null)
  const [flashWarnings, setFlashWarnings] = useState<ExplorerWarning[]>([])

  useEffect(() => {
    loadLe().then(setLe).catch(() => setLe(null))
    loadHle().then(setHle).catch(() => setHle(null))
    loadLookups().then(setLookups).catch(() => setLookups(null))
    loadDeprivation().then(setDeprivation).catch(() => setDeprivation(null))
  }, [])

  const query = searchParams.toString()
  const parsed = useMemo(
    () => parseSearchParams(new URLSearchParams(query)),
    [query]
  )
  const family = familyOf(parsed.metric ?? DEFAULT_STATE.metric)

  useEffect(() => {
    if (family === "avoidable" && !avoidable) {
      loadAvoidable().then(setAvoidable).catch(() => setAvoidable(null))
    }
  }, [family, avoidable])

  const areaByCode = useMemo(
    () => indexAreas([le, hle, avoidable].filter(Boolean) as PackedFile[]),
    [le, hle, avoidable]
  )

  const periodsFor = useCallback(
    (metric: MetricId) => {
      const kind = familyOf(metric)
      if (kind === "le" || kind === "deprivation") return le?.periods ?? []
      if (kind === "hle") return hle?.periods ?? []
      if (kind === "avoidable") return avoidable?.periods ?? []
      return ["2025"]
    },
    [le, hle, avoidable]
  )

  const ctx = useMemo(() => {
    if (!lookups) return null
    return { lookups, periodsFor, areaByCode }
  }, [lookups, periodsFor, areaByCode])

  const applied = useMemo(() => {
    if (!ctx) return { state: { ...DEFAULT_STATE, ...parsed }, warnings: [] }
    return applyExplorerChange(DEFAULT_STATE, parsed, ctx)
  }, [ctx, parsed])

  const state = applied.state
  const warnings = useMemo(() => {
    const byId = new Map(applied.warnings.map((warning) => [warning.id, warning]))
    for (const warning of flashWarnings) byId.set(warning.id, warning)
    return [...byId.values()]
  }, [applied.warnings, flashWarnings])

  const persistMismatch = useCallback((nextWarnings: ExplorerWarning[]) => {
    setFlashWarnings(nextWarnings.filter((warning) => warning.tone === "mismatch"))
  }, [])

  useEffect(() => {
    if (!ctx) return
    const canonical = toSearchParams(state).toString()
    const current = toSearchParams({ ...DEFAULT_STATE, ...parsed }).toString()
    if (canonical !== current) {
      router.replace(`${pathname}?${canonical}`, { scroll: false })
    }
  }, [ctx, state, parsed, pathname, router])

  const commit = useCallback(
    (patch: Partial<ExplorerState>) => {
      if (!ctx) return
      const next = applyExplorerChange(state, patch, ctx)
      const mismatch = next.warnings.filter((warning) => warning.tone === "mismatch")
      if (
        mismatch.length ||
        patch.metric !== undefined ||
        patch.geo !== undefined ||
        patch.area !== undefined
      ) {
        persistMismatch(next.warnings)
      }
      router.replace(`${pathname}?${toSearchParams(next.state).toString()}`, {
        scroll: false,
      })
    },
    [ctx, pathname, persistMismatch, router, state]
  )

  const mapMetric: MetricId = familyOf(state.metric) === "deprivation" ? "le" : state.metric
  const mapFamily = familyOf(mapMetric)
  const file =
    mapFamily === "le" ? le : mapFamily === "hle" ? hle : mapFamily === "avoidable" ? avoidable : null

  const areas = useMemo(() => {
    if (!file) return []
    return areasForGeo(file, state.geo, mapMetric)
  }, [file, mapMetric, state.geo])

  const ready = Boolean(lookups && file)

  const rail = (
    <div className="space-y-4">
      <CatalogueRail
        metric={state.metric}
        onSelect={(metric) => {
          commit({ metric })
          setCutsOpen(false)
        }}
      />
      <FilterPanel
        state={state}
        areas={areas}
        onChange={commit}
      />
    </div>
  )

  return (
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 overflow-x-clip lg:h-full lg:flex-row">
      <aside className="hidden w-[220px] shrink-0 overflow-y-auto border-r pr-3 lg:block">
        {rail}
      </aside>
      <div className="flex flex-col gap-2 lg:hidden">
        <Sheet open={cutsOpen} onOpenChange={setCutsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-11 w-full justify-between text-left">
              <span>Browse cuts</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {metricLabel(state.metric)}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="flex max-h-[88dvh] w-full flex-col overflow-y-auto rounded-t-xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <SheetHeader className="text-left">
              <SheetTitle>Catalogue</SheetTitle>
              <SheetDescription>
                Switching metric reloads Explore.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4">{rail}</div>
          </SheetContent>
        </Sheet>
        <CompactFilterBar state={state} onChange={commit} />
      </div>
      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 lg:min-h-0">
        <WarningBanner warnings={warnings} />
        {ready ? (
          <LinkedOverview
            key={mapFamily}
            state={state}
            mapMetric={mapMetric}
            file={file}
            deprivation={deprivation}
            areas={areas}
            onChange={commit}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading ONS figures…</p>
        )}
      </div>
    </div>
  )
}

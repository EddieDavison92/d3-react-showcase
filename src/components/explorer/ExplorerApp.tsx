"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AreaPanel } from "@/components/explorer/AreaPanel"
import { MapView } from "@/components/explorer/MapView"
import { Toolbar } from "@/components/explorer/Toolbar"
import { useMapModel } from "@/components/explorer/use-map-model"
import { familyOf } from "@/lib/explorer/catalogue"
import {
  areasForGeo,
  areasToSearch,
  indexAreas,
  loadAvoidable,
  loadDeprivation,
  loadHle,
  loadLe,
  loadLookups,
} from "@/lib/explorer/data"
import { loadEvidence, type EvidenceFile } from "@/lib/explorer/evidence"
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
  const [le, setLe] = useState<PackedFile | null>(null)
  const [hle, setHle] = useState<PackedFile | null>(null)
  const [avoidable, setAvoidable] = useState<PackedFile | null>(null)
  const [deprivation, setDeprivation] = useState<DeprivationFile | null>(null)
  const [lookups, setLookups] = useState<LookupsFile | null>(null)
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null)
  const [notice, setNotice] = useState<ExplorerWarning | null>(null)

  useEffect(() => {
    loadLe().then(setLe).catch(() => setLe(null))
    loadHle().then(setHle).catch(() => setHle(null))
    loadLookups().then(setLookups).catch(() => setLookups(null))
    loadDeprivation().then(setDeprivation).catch(() => setDeprivation(null))
    loadEvidence().then(setEvidence).catch(() => setEvidence(null))
  }, [])

  const query = searchParams.toString()
  const parsed = useMemo(() => parseSearchParams(new URLSearchParams(query)), [query])
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
      if (kind === "hle") return hle?.periods ?? []
      if (kind === "avoidable") return avoidable?.periods ?? []
      return le?.periods ?? []
    },
    [le, hle, avoidable]
  )

  const ctx = useMemo(
    () => (lookups ? { lookups, periodsFor, areaByCode } : null),
    [lookups, periodsFor, areaByCode]
  )

  const state = useMemo(() => {
    if (!ctx) return { ...DEFAULT_STATE, ...parsed }
    return applyExplorerChange(DEFAULT_STATE, parsed, ctx).state
  }, [ctx, parsed])

  // Keep the URL canonical once lookups have loaded.
  useEffect(() => {
    if (!ctx) return
    const canonical = toSearchParams(state).toString()
    const current = toSearchParams({ ...DEFAULT_STATE, ...parsed }).toString()
    if (canonical !== current) router.replace(`${pathname}?${canonical}`, { scroll: false })
  }, [ctx, state, parsed, pathname, router])

  const commit = useCallback(
    (patch: Partial<ExplorerState>) => {
      if (!ctx) return
      const next = applyExplorerChange(state, patch, ctx)
      setNotice(next.warnings.find((w) => w.tone !== "always") ?? null)
      router.replace(`${pathname}?${toSearchParams(next.state).toString()}`, { scroll: false })
    },
    [ctx, pathname, router, state]
  )

  // Deprivation is no longer its own map; old links open life expectancy.
  const mapMetric: MetricId = familyOf(state.metric) === "deprivation" ? "le" : state.metric
  const mapFamily = familyOf(mapMetric)
  const file = mapFamily === "hle" ? hle : mapFamily === "avoidable" ? avoidable : le

  const areas = useMemo(
    () => (file ? areasForGeo(file, state.geo, mapMetric) : []),
    [file, mapMetric, state.geo]
  )
  const places = useMemo(() => (file ? areasToSearch(file, mapMetric) : []), [file, mapMetric])
  const model = useMapModel(state, mapMetric, file, areas)

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <Toolbar
        state={state}
        places={places}
        redirects={lookups?.districtToUtla}
        onChange={commit}
      />
      {notice ? (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <p>
            <span className="font-medium">{notice.title}.</span> {notice.body}
          </p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-amber-800 hover:text-amber-950"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}
      {file && model && lookups ? (
        <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <MapView
            key={mapFamily}
            state={state}
            mapMetric={mapMetric}
            file={file}
            areas={areas}
            model={model}
            onChange={commit}
          />
          <AreaPanel
            state={state}
            mapMetric={mapMetric}
            file={file}
            areas={areas}
            model={model}
            le={le}
            hle={hle}
            lookups={lookups}
            deprivation={deprivation}
            evidence={evidence}
            onChange={commit}
          />
        </div>
      ) : (
        <div className="flex h-[60dvh] items-center justify-center rounded-lg border border-slate-200 text-sm text-slate-500">
          Loading ONS figures…
        </div>
      )}
    </div>
  )
}

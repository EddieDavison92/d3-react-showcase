"use client"

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AreaCard } from "@/components/atlas/AreaCard"
import { ControlPanel } from "@/components/atlas/ControlPanel"
import { HistLegend } from "@/components/atlas/HistLegend"
import { MapView } from "@/components/explorer/MapView"
import { PeriodScrub } from "@/components/explorer/PeriodScrub"
import { useMapModel } from "@/components/explorer/use-map-model"
import { familyOf } from "@/lib/explorer/catalogue"
import {
  areasForGeo,
  areasToSearch,
  indexAreas,
  loadAvoidable,
  loadHle,
  loadLe,
  loadLookups,
} from "@/lib/explorer/data"
import { applyExplorerChange } from "@/lib/explorer/nesting"
import { DEFAULT_STATE, parseSearchParams, toSearchParams } from "@/lib/explorer/url-state"
import { legendCaption, legendEnds } from "@/lib/explorer/views"
import type {
  ExplorerState,
  ExplorerWarning,
  LookupsFile,
  MetricId,
  PackedFile,
} from "@/lib/explorer/types"

const GLASS =
  "rounded-2xl border border-white/70 bg-paper/85 shadow-[0_24px_60px_-32px_rgba(17,19,21,0.5)] backdrop-blur-xl"
const DESKTOP_PADDING = { top: 36, bottom: 236, left: 360, right: 420 }
const MOBILE_PADDING = { top: 16, bottom: 16, left: 16, right: 16 }

function useDesktop() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia("(min-width: 1024px)")
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => true
  )
}

export function ExplorerApp() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const desktop = useDesktop()
  const [le, setLe] = useState<PackedFile | null>(null)
  const [hle, setHle] = useState<PackedFile | null>(null)
  const [avoidable, setAvoidable] = useState<PackedFile | null>(null)
  const [lookups, setLookups] = useState<LookupsFile | null>(null)
  const [notice, setNotice] = useState<ExplorerWarning | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    loadLe().then(setLe).catch(() => setLe(null))
    loadHle().then(setHle).catch(() => setHle(null))
    loadLookups().then(setLookups).catch(() => setLookups(null))
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
  const ready = Boolean(file && model && lookups)

  const pick = (code: string) => {
    const hit = places.find((p) => p.code === code)
    commit(hit ? { area: code, geo: hit.geo } : { area: code })
  }

  const ends = legendEnds(state.view, model?.unit)
  const selected = state.area ? areas.find((a) => a.code === state.area) : undefined
  const selectedValue = state.area && model ? model.values[state.area] : null

  return (
    <div className="-mx-4 flex flex-col gap-4 sm:-mx-6 lg:relative lg:-mx-10 lg:block lg:h-[calc(100dvh-3.5rem)] lg:overflow-hidden">
      {/* Map */}
      <div className="relative order-2 h-[58dvh] min-h-[360px] lg:absolute lg:inset-0 lg:h-auto">
        {ready && file && model ? (
          <MapView
            key={mapFamily}
            state={state}
            mapMetric={mapMetric}
            file={file}
            areas={areas}
            model={model}
            scrubbing={scrubbing}
            fitPadding={desktop ? DESKTOP_PADDING : MOBILE_PADDING}
            onChange={commit}
          />
        ) : (
          <p className="flex h-full items-center justify-center text-sm text-ink-3">Loading ONS figures…</p>
        )}
        {notice ? (
          <div className="absolute left-1/2 top-4 z-20 flex w-[min(92%,34rem)] -translate-x-1/2 items-start gap-3 rounded-xl border border-[#e9d6a8] bg-[#fbf3df]/95 px-4 py-2.5 text-sm text-[#5c4712] shadow-lg backdrop-blur animate-rise">
            <p className="flex-1">
              <span className="font-medium">{notice.title}.</span> {notice.body}
            </p>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="text-[#8a6d1f] hover:text-[#5c4712]">
              ×
            </button>
          </div>
        ) : null}
      </div>

      {/* Controls */}
      <aside className={`order-1 mx-4 p-4 sm:mx-6 lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:z-10 lg:mx-0 lg:w-[320px] lg:overflow-y-auto ${GLASS}`}>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="kicker">Atlas</p>
            <h1 className="display mt-1 text-2xl text-ink lg:text-3xl">Every place, every year</h1>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className="shrink-0 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-ink lg:hidden"
          >
            {filtersOpen ? "Done" : "Filters"}
          </button>
        </div>
        <ControlPanel state={state} places={places} onChange={commit} onPick={pick} collapsed={!filtersOpen} />
      </aside>

      {/* Legend and timeline */}
      {ready && file && model ? (
        <div className={`order-3 mx-4 space-y-3 px-5 py-4 sm:mx-6 lg:absolute lg:bottom-4 lg:left-[352px] lg:right-[412px] lg:z-10 lg:mx-0 ${GLASS}`}>
          {state.geo !== "country" ? (
            <HistLegend
              values={Object.values(model.values)}
              ramp={model.ramp}
              min={model.min}
              max={model.max}
              diverging={model.diverging}
              caption={legendCaption(state.view, model.unit)}
              leftLabel={ends.leftShort ?? ends.left}
              rightLabel={ends.rightShort ?? ends.right}
              digits={model.unit === "years" ? (model.diverging ? 1 : 0) : 0}
              marker={selected && selectedValue != null ? { value: selectedValue, label: selected.name } : null}
            />
          ) : null}
          <PeriodScrub periods={file.periods} year={state.year} onYear={(year) => commit({ year })} onDragging={setScrubbing} />
        </div>
      ) : null}

      {/* Area */}
      {ready && file && model ? (
        <aside className={`order-4 mx-4 p-5 sm:mx-6 lg:absolute lg:right-4 lg:top-4 lg:z-10 lg:mx-0 lg:max-h-[calc(100%-2rem)] lg:w-[380px] lg:overflow-y-auto ${GLASS}`}>
          <AreaCard state={state} mapMetric={mapMetric} file={file} areas={areas} model={model} onChange={commit} />
        </aside>
      ) : null}
    </div>
  )
}

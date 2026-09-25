"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type * as maplibregl from "maplibre-gl"
import type { Feature, FeatureCollection } from "geojson"
import { hoverText, sexGapHover } from "@/components/explorer/map-helpers"
import type { MapModel } from "@/components/explorer/use-map-model"
import { dimKey, geoUrl, readPoint } from "@/lib/explorer/data"
import { formatRate, formatSigned, formatYears } from "@/lib/explorer/format"
import { legendCaption } from "@/lib/explorer/views"
import type { AreaRecord, ExplorerState, MetricId, PackedFile } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const ChoroplethMap = dynamic(
  () => import("@/components/explorer/ChoroplethMap").then((mod) => mod.ChoroplethMap),
  { ssr: false, loading: () => <div className="h-full bg-paper" /> }
)

/** The map itself, or a table when the geography is the four nations. */
export function MapView({
  state,
  mapMetric,
  file,
  areas,
  model,
  scrubbing,
  fitPadding,
  onChange,
}: {
  state: ExplorerState
  mapMetric: MetricId
  file: PackedFile
  areas: AreaRecord[]
  model: MapModel
  scrubbing?: boolean
  fitPadding?: maplibregl.PaddingOptions
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const showMap = state.geo !== "country"
  const [geoPayload, setGeoPayload] = useState<{ geo: string; data: FeatureCollection } | null>(null)
  const [geoFailed, setGeoFailed] = useState(false)

  useEffect(() => {
    if (!showMap) return
    const geo = state.geo
    let cancelled = false
    fetch(geoUrl(geo))
      .then((res) => {
        if (!res.ok) throw new Error(`geo ${res.status}`)
        return res.json() as Promise<FeatureCollection>
      })
      .then((data) => {
        if (cancelled) return
        setGeoFailed(false)
        setGeoPayload({ geo, data })
      })
      .catch(() => {
        if (!cancelled) setGeoFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [state.geo, showMap])

  const geojson = useMemo(() => {
    if (!showMap || !geoPayload || geoPayload.geo !== state.geo) return null
    const allowed = new Set(areas.map((area) => area.code))
    return {
      type: "FeatureCollection" as const,
      features: geoPayload.data.features.filter((feature) =>
        allowed.has(String(feature.properties?.code ?? ""))
      ) as Feature[],
    }
  }, [areas, geoPayload, showMap, state.geo])

  const dim = dimKey(mapMetric, state.age)
  const { unit, periodIndex, derived } = model

  const formatHover = (code: string, name: string) => {
    if (state.view === "sex_gap") {
      return sexGapHover(
        name,
        readPoint(file, code, "Male", dim, periodIndex),
        readPoint(file, code, "Female", dim, periodIndex),
        unit
      )
    }
    const cell = derived[code]
    if (state.view !== "absolute" && state.view !== "ci" && cell?.value == null) {
      return `${name}\n${cell?.hoverExtra ?? "No figure"}`
    }
    return hoverText(name, readPoint(file, code, state.sex, dim, periodIndex), unit, cell?.hoverExtra)
  }

  if (!showMap) {
    return (
      <NationTable
        areas={areas}
        values={model.values}
        unit={legendCaption(state.view, unit)}
        selected={state.area}
        onSelect={(code) => onChange({ area: code })}
      />
    )
  }

  if (geoFailed) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-ink-3">
        Boundaries didn&apos;t load. Reload or pick another geography.
      </p>
    )
  }

  return geojson && geojson.features.length ? (
    <ChoroplethMap
      geojson={geojson}
      colours={model.colours}
      hatch={model.hatch}
      selected={state.area}
      year={state.year}
      view={state.view}
      quietHover={scrubbing}
      fitPadding={fitPadding}
      className="rounded-none"
      onSelect={(code) => onChange({ area: code === state.area ? null : code })}
      formatHover={formatHover}
    />
  ) : (
    <p className="flex h-full items-center justify-center text-sm text-ink-3">Loading map…</p>
  )
}

function NationTable({
  areas,
  values,
  unit,
  selected,
  onSelect,
}: {
  areas: AreaRecord[]
  values: Record<string, number | null>
  unit: string
  selected: string | null
  onSelect: (code: string) => void
}) {
  const perHundredK = unit.includes("100,000")
  const signed = unit.startsWith("Δ") || unit.includes("M − F")
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <p className="kicker mb-3">The four nations and the UK</p>
        <ul className="divide-y divide-line border-y border-line">
          {areas.map((area) => {
            const value = values[area.code]
            return (
              <li key={area.code}>
                <button
                  type="button"
                  onClick={() => onSelect(area.code)}
                  aria-pressed={selected === area.code}
                  className={cn(
                    "flex w-full items-baseline justify-between px-2 py-3 text-left transition hover:bg-white/70",
                    selected === area.code && "bg-white"
                  )}
                >
                  <span className="display text-xl text-ink">{area.name}</span>
                  <span className="display text-2xl tabular text-ink">
                    {signed ? formatSigned(value) : perHundredK ? formatRate(value) : formatYears(value)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-right text-2xs text-ink-3">{unit}</p>
      </div>
    </div>
  )
}

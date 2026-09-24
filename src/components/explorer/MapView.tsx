"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { Feature, FeatureCollection } from "geojson"
import { hoverText, sexGapHover } from "@/components/explorer/map-helpers"
import { MapLegend } from "@/components/explorer/MapLegend"
import { PeriodScrub } from "@/components/explorer/PeriodScrub"
import type { MapModel } from "@/components/explorer/use-map-model"
import { dimKey, geoUrl, readPoint } from "@/lib/explorer/data"
import { formatRate, formatSigned, formatYears } from "@/lib/explorer/format"
import { legendCaption, legendEnds } from "@/lib/explorer/views"
import type { AreaRecord, ExplorerState, MetricId, PackedFile } from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const ChoroplethMap = dynamic(
  () => import("@/components/explorer/ChoroplethMap").then((mod) => mod.ChoroplethMap),
  { ssr: false, loading: () => <div className="h-full bg-slate-50" /> }
)

export function MapView({
  state,
  mapMetric,
  file,
  areas,
  model,
  onChange,
}: {
  state: ExplorerState
  mapMetric: MetricId
  file: PackedFile
  areas: AreaRecord[]
  model: MapModel
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const showMap = state.geo !== "country"
  const [scrubbing, setScrubbing] = useState(false)
  const [geoPayload, setGeoPayload] = useState<{ geo: string; data: FeatureCollection } | null>(
    null
  )
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
  const ends = legendEnds(state.view, unit)
  const selected = state.area ? areas.find((area) => area.code === state.area) : undefined
  const selectedValue = state.area ? model.values[state.area] : null

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

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      {showMap ? (
        <div className="relative h-[52dvh] min-h-[320px] w-full bg-slate-50 lg:h-[calc(100dvh-15.5rem)] lg:min-h-[480px]">
          {geoFailed ? (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              Boundaries didn&apos;t load. Reload or pick another geography.
            </p>
          ) : geojson && geojson.features.length ? (
            <ChoroplethMap
              geojson={geojson}
              colours={model.colours}
              hatch={model.hatch}
              selected={state.area}
              year={state.year}
              view={state.view}
              quietHover={scrubbing}
              className="rounded-none"
              onSelect={(code) => onChange({ area: code === state.area ? null : code })}
              formatHover={formatHover}
            />
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-slate-500">
              Loading map…
            </p>
          )}
        </div>
      ) : (
        <NationTable
          areas={areas}
          values={model.values}
          unit={legendCaption(state.view, unit)}
          selected={state.area}
          onSelect={(code) => onChange({ area: code })}
        />
      )}
      <div className="space-y-2 border-t border-slate-200 px-4 py-3">
        {showMap ? (
          <MapLegend
            min={model.min}
            max={model.max}
            ramp={model.ramp}
            unit={legendCaption(state.view, unit)}
            zeroTick={model.diverging}
            leftLabel={ends.left}
            rightLabel={ends.right}
            leftLabelShort={ends.leftShort}
            rightLabelShort={ends.rightShort}
            ariaLabel={ends.aria}
            marker={
              selected && selectedValue != null
                ? { value: selectedValue, label: selected.name }
                : null
            }
            note={
              state.view === "ci"
                ? "Hatched areas have the widest 95% confidence intervals (top quarter)."
                : undefined
            }
          />
        ) : null}
        <PeriodScrub
          periods={file.periods}
          year={state.year}
          onYear={(year) => onChange({ year })}
          onDragging={setScrubbing}
        />
      </div>
    </div>
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
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
          <th className="px-4 py-2.5 font-medium">Nation</th>
          <th className="px-4 py-2.5 text-right font-medium">{unit}</th>
        </tr>
      </thead>
      <tbody>
        {areas.map((area) => {
          const value = values[area.code]
          return (
            <tr
              key={area.code}
              className={cn(
                "border-b border-slate-100 last:border-0 hover:bg-slate-50",
                selected === area.code && "bg-slate-50 font-medium"
              )}
            >
              <td className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onSelect(area.code)}
                  aria-pressed={selected === area.code}
                  className="text-left hover:underline"
                >
                  {area.name}
                </button>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {signed ? formatSigned(value) : perHundredK ? formatRate(value) : formatYears(value)}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { FeatureCollection, Feature } from "geojson"

const ChoroplethMap = dynamic(
  () => import("@/components/explorer/ChoroplethMap").then((mod) => mod.ChoroplethMap),
  { ssr: false, loading: () => <div className="h-full rounded-lg border bg-slate-50" /> }
)
import { ContextChip } from "@/components/explorer/ContextChip"
import { colourLookup, hoverText } from "@/components/explorer/map-helpers"
import { MapLegend } from "@/components/explorer/MapLegend"
import { SeriesPanel } from "@/components/explorer/SeriesPanel"
import {
  AVOIDABLE_RAMP,
  DEPRIVATION_RAMP,
  DIVERGING_RAMP,
  TEAL_RAMP,
} from "@/lib/explorer/colours"
import { familyOf, metricLabel } from "@/lib/explorer/catalogue"
import { areasForGeo, dimKey, geoUrl, readPoint, readSeries } from "@/lib/explorer/data"
import { formatYears } from "@/lib/explorer/format"
import type {
  AreaRecord,
  DeprivationFile,
  ExplorerState,
  PackedFile,
  PackedPoint,
} from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const COMPARE_COLOURS = ["#0f766e", "#7c3aed", "#c2410c"]

export function LinkedOverview({
  state,
  file,
  deprivation,
  areas,
  onChange,
}: {
  state: ExplorerState
  file: PackedFile | null
  deprivation: DeprivationFile | null
  areas: AreaRecord[]
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const family = familyOf(state.metric)
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const showMap = state.geo !== "country"
  const areaIndex = useMemo(
    () => new Map(areas.map((area) => [area.code, area])),
    [areas]
  )

  useEffect(() => {
    if (!showMap) return
    const allowed = new Set(areas.map((a) => a.code))
    let cancelled = false
    fetch(geoUrl(state.geo))
      .then((res) => res.json())
      .then((raw: FeatureCollection) => {
        if (cancelled) return
        const features = raw.features.filter((feature) =>
          allowed.has(String(feature.properties?.code ?? ""))
        ) as Feature[]
        setGeojson({ type: "FeatureCollection", features })
      })
      .catch(() => {
        if (!cancelled) setGeojson({ type: "FeatureCollection", features: [] })
      })
    return () => {
      cancelled = true
    }
  }, [state.geo, showMap, areas])

  const periodIndex = file ? file.periods.indexOf(state.year) : -1
  const dim = file ? dimKey(state.metric, state.age) : "birth"
  const sex = family === "deprivation" ? "Male" : state.sex

  const values = useMemo(() => {
    const out: Record<string, number | null> = {}
    if (family === "deprivation") {
      const iod = deprivation?.england?.values ?? {}
      for (const area of areas) {
        const rec = iod[area.code]
        out[area.code] = rec ? -rec.rankAverageScore : null
      }
      return out
    }
    if (!file || periodIndex < 0) return out
    for (const area of areas) {
      const point = readPoint(file, area.code, sex, dim, periodIndex)
      if (state.view === "delta") {
        const prev = readPoint(file, area.code, sex, dim, periodIndex - 1)
        out[area.code] =
          point?.[0] !== null &&
          point?.[0] !== undefined &&
          prev?.[0] !== null &&
          prev?.[0] !== undefined
            ? (point[0] as number) - (prev[0] as number)
            : null
      } else {
        out[area.code] = point?.[0] ?? null
      }
    }
    return out
  }, [areas, deprivation, dim, family, file, periodIndex, sex, state.view])

  const ramp =
    state.view === "delta"
      ? DIVERGING_RAMP
      : family === "avoidable"
        ? AVOIDABLE_RAMP
        : family === "deprivation"
          ? DEPRIVATION_RAMP
          : TEAL_RAMP

  const painted = useMemo(
    () => colourLookup(values, ramp, state.view === "delta"),
    [values, ramp, state.view]
  )

  const unit =
    family === "avoidable"
      ? "per 100,000"
      : family === "deprivation"
        ? "rank (1 = most deprived)"
        : "years"

  const selectedName = state.area ? areaIndex.get(state.area)?.name : null
  const seriesCodes = Array.from(
    new Set([state.area, ...state.compare].filter(Boolean))
  ) as string[]

  const series = useMemo(() => {
    if (!file) return []
    return seriesCodes.map((code, i) => ({
      code,
      name: areaIndex.get(code)?.name ?? code,
      colour: COMPARE_COLOURS[i] ?? "#334155",
      points: readSeries(file, code, sex, dim) ?? file.periods.map((): PackedPoint => [null, null, null]),
    }))
  }, [areaIndex, dim, file, seriesCodes, sex])

  const walesEmpty = family === "deprivation" && state.area?.startsWith("W")
  const scotNiEmpty =
    family === "deprivation" &&
    Boolean(state.area && (state.area.startsWith("S") || state.area.startsWith("N")))

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="relative flex min-h-[320px] flex-[0.55] flex-col gap-2">
        <ContextChip state={state} areaName={selectedName} />
        {family === "deprivation" && !deprivation?.england ? (
          <EmptyNote title="Deprivation file missing">
            England IoD 2025 could not be loaded. We are not inventing ranks.
          </EmptyNote>
        ) : walesEmpty ? (
          <EmptyNote title="Wales — WIMD not bundled">
            WIMD 2025 exists as a separate Welsh Government index. This build does
            not ship invented Wales ranks, and it will not draw IoD on Wales.
          </EmptyNote>
        ) : scotNiEmpty ? (
          <EmptyNote title="Scotland and Northern Ireland">
            SIMD and NIMDM are not interactive in v1 and cannot be ranked with IoD.
          </EmptyNote>
        ) : showMap && geojson ? (
          <div className="relative min-h-0 flex-1">
            <ChoroplethMap
              geojson={geojson}
              colours={painted.colours}
              selected={state.area}
              onSelect={(code) => onChange({ area: code })}
              formatHover={(code, name) => {
                if (family === "deprivation") {
                  const rec = deprivation?.england?.values[code]
                  if (!rec) return `${name}\nNo IoD figure`
                  return `${name}\nRank of average score ${rec.rankAverageScore} of England LAs (1 = most deprived)\nAverage score ${formatYears(rec.averageScore, 1)}`
                }
                const point = file ? readPoint(file, code, sex, dim, periodIndex) : null
                const extra =
                  state.view === "delta" && values[code] !== null
                    ? `Change ${formatYears(values[code], 1)} ${unit}`
                    : undefined
                return hoverText(name, point, unit, extra)
              }}
            />
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 max-w-sm">
              <MapLegend
                min={family === "deprivation" ? -painted.max : painted.min}
                max={family === "deprivation" ? -painted.min : painted.max}
                ramp={ramp}
                unit={
                  state.view === "delta"
                    ? `Δ ${unit}`
                    : family === "deprivation"
                      ? "more deprived →"
                      : unit
                }
              />
            </div>
          </div>
        ) : (
          <CountryTable
            areas={areas}
            values={values}
            selected={state.area}
            onSelect={(code) => onChange({ area: code })}
            unit={unit}
          />
        )}
      </div>
      <div className="flex min-h-[260px] flex-[0.45] flex-col rounded-lg border bg-card p-3">
        {family === "deprivation" ? (
          <DeprivationPanel
            state={state}
            deprivation={deprivation}
            areaName={selectedName}
          />
        ) : (
          <SeriesPanel
            periods={file?.periods ?? []}
            series={series}
            year={state.year}
            unit={unit}
            onYear={(year) => onChange({ year })}
            canCompare={Boolean(state.area) && state.compare.length < 2}
            onAddCompare={() => {
              if (!state.area) return
              if (state.compare.includes(state.area)) return
              onChange({ compare: [...state.compare, state.area].slice(0, 2) })
            }}
            onRemoveCompare={(code) =>
              onChange({ compare: state.compare.filter((item) => item !== code) })
            }
          />
        )}
      </div>
    </div>
  )
}

function EmptyNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center rounded-lg border border-dashed bg-muted/30 p-6">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

function CountryTable({
  areas,
  values,
  selected,
  onSelect,
  unit,
}: {
  areas: AreaRecord[]
  values: Record<string, number | null>
  selected: string | null
  onSelect: (code: string) => void
  unit: string
}) {
  return (
    <div className="flex-1 overflow-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Area</th>
            <th className="px-3 py-2">Value</th>
          </tr>
        </thead>
        <tbody>
          {areas.map((area) => (
            <tr
              key={area.code}
              className={cn(
                "cursor-pointer border-t hover:bg-muted/40",
                selected === area.code && "bg-teal-50 dark:bg-teal-950/40"
              )}
              onClick={() => onSelect(area.code)}
            >
              <td className="px-3 py-2">{area.name}</td>
              <td className="px-3 py-2">
                {formatYears(values[area.code])} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeprivationPanel({
  state,
  deprivation,
  areaName,
}: {
  state: ExplorerState
  deprivation: DeprivationFile | null
  areaName?: string | null
}) {
  const rec = state.area ? deprivation?.england?.values[state.area] : undefined
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <p className="font-medium">{metricLabel(state.metric)}</p>
      <p className="text-muted-foreground">
        England-only IoD 2025 File 10 (lower-tier). Rank of average score — 1 is
        the most deprived local authority district in England. This is context,
        not a cause, and it is not comparable with WIMD, SIMD or NIMDM.
      </p>
      {rec && areaName ? (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="font-medium">{areaName}</p>
          <p>Rank of average score: {rec.rankAverageScore}</p>
          <p>Average score: {formatYears(rec.averageScore, 2)}</p>
          <p>
            Share of LSOAs in most deprived 10% nationally:{" "}
            {(rec.propMostDeprived10 * 100).toFixed(1)}%
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">Select an English local area on the map.</p>
      )}
    </div>
  )
}

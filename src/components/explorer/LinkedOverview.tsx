"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import type { FeatureCollection, Feature } from "geojson"

const ChoroplethMap = dynamic(
  () => import("@/components/explorer/ChoroplethMap").then((mod) => mod.ChoroplethMap),
  { ssr: false, loading: () => <div className="h-full bg-[#f8fafc]" /> }
)
import { ContextChip } from "@/components/explorer/ContextChip"
import { DeprivationStrip } from "@/components/explorer/DeprivationStrip"
import { FocusReadout } from "@/components/explorer/FocusReadout"
import { colourLookup, hoverText, sexGapHover } from "@/components/explorer/map-helpers"
import { MapLegend } from "@/components/explorer/MapLegend"
import { PeriodScrub, SeriesPanel } from "@/components/explorer/SeriesPanel"
import { ViewSwitcher } from "@/components/explorer/ViewSwitcher"
import {
  AVOIDABLE_RAMP,
  DIVERGING_RAMP,
  TEAL_RAMP,
} from "@/lib/explorer/colours"
import { familyOf } from "@/lib/explorer/catalogue"
import { dimKey, geoUrl, readPoint, readSeries } from "@/lib/explorer/data"
import { comparatorsFor, deriveMap, NATION_COMPARATOR } from "@/lib/explorer/derive"
import { formatCi, formatYears } from "@/lib/explorer/format"
import { isDivergingView, legendCaption, legendEnds, viewsFor } from "@/lib/explorer/views"
import type {
  AreaRecord,
  DeprivationFile,
  ExplorerState,
  MetricId,
  PackedFile,
  PackedPoint,
} from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const COMPARE_COLOURS = ["#0f766e", "#7c3aed", "#c2410c"]

export function LinkedOverview({
  state,
  mapMetric,
  file,
  deprivation,
  areas,
  divergence,
  onChange,
}: {
  state: ExplorerState
  mapMetric: MetricId
  file: PackedFile | null
  deprivation: DeprivationFile | null
  areas: AreaRecord[]
  divergence?: { years: number; grain: string } | null
  onChange: (patch: Partial<ExplorerState>) => void
}) {
  const family = familyOf(state.metric)
  const mapFamily = familyOf(mapMetric)
  const [geoPayload, setGeoPayload] = useState<{
    geo: string
    data: FeatureCollection
  } | null>(null)
  const [geoFailed, setGeoFailed] = useState(false)
  const [scrubbing, setScrubbing] = useState(false)
  const showMap = state.geo !== "country"
  const areaIndex = useMemo(
    () => new Map(areas.map((area) => [area.code, area])),
    [areas]
  )
  const selectedArea = state.area ? areaIndex.get(state.area) : undefined

  useEffect(() => {
    if (!showMap) return
    const geo = state.geo
    let cancelled = false
    fetch(geoUrl(geo))
      .then((res) => {
        if (!res.ok) throw new Error(`geo ${res.status}`)
        return res.json() as Promise<FeatureCollection>
      })
      .then((raw) => {
        if (cancelled) return
        setGeoFailed(false)
        setGeoPayload({ geo, data: raw })
      })
      .catch(() => {
        if (cancelled) return
        setGeoFailed(true)
        setGeoPayload(null)
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

  const periodIndex = file ? file.periods.indexOf(state.year) : -1
  const dim = file ? dimKey(mapMetric, state.age) : "birth"
  const sex = state.sex

  const derived = useMemo(() => {
    if (!file || periodIndex < 0) return {}
    return deriveMap({
      view: state.view,
      file,
      areas,
      metric: mapMetric,
      sex,
      age: state.age,
      periodIndex,
    })
  }, [areas, file, mapMetric, periodIndex, sex, state.age, state.view])

  const values = useMemo(() => {
    const out: Record<string, number | null> = {}
    for (const [code, cell] of Object.entries(derived)) out[code] = cell.value
    return out
  }, [derived])

  const hatch = useMemo(() => {
    if (state.view !== "ci") return undefined
    const flags: Record<string, boolean> = {}
    for (const [code, cell] of Object.entries(derived)) {
      if (cell.uncertain) flags[code] = true
    }
    return flags
  }, [derived, state.view])

  const diverging = isDivergingView(state.view)
  const ramp =
    diverging
      ? DIVERGING_RAMP
      : mapFamily === "avoidable"
        ? AVOIDABLE_RAMP
        : TEAL_RAMP

  const painted = useMemo(
    () => colourLookup(values, ramp, diverging),
    [values, ramp, diverging]
  )

  const unit = mapFamily === "avoidable" ? "per 100,000" : "years"
  const selectedName = selectedArea?.name ?? null
  const ukComparator = file?.areas.find((area) => area.code === NATION_COMPARATOR.UK.code)
  const seriesCodes = Array.from(
    new Set(
      [state.area, ...state.compare, !state.area && ukComparator ? ukComparator.code : null].filter(
        Boolean
      )
    )
  ) as string[]

  const series = useMemo(() => {
    if (!file) return []
    if (state.view === "sex_gap") {
      const code = state.area ?? ukComparator?.code
      if (!code) return []
      const name =
        areaIndex.get(code)?.name ??
        file.areas.find((area) => area.code === code)?.name ??
        code
      return [
        {
          code: `${code}-M`,
          name: `${name} · Male`,
          colour: COMPARE_COLOURS[0],
          points: readSeries(file, code, "Male", dim) ?? emptySeries(file.periods),
        },
        {
          code: `${code}-F`,
          name: `${name} · Female`,
          colour: COMPARE_COLOURS[1],
          points: readSeries(file, code, "Female", dim) ?? emptySeries(file.periods),
        },
      ]
    }
    return seriesCodes.map((code, i) => ({
      code,
      name:
        areaIndex.get(code)?.name ??
        file.areas.find((area) => area.code === code)?.name ??
        code,
      colour: COMPARE_COLOURS[i] ?? "#334155",
      points: readSeries(file, code, sex, dim) ?? emptySeries(file.periods),
    }))
  }, [areaIndex, dim, file, seriesCodes, sex, state.area, state.view, ukComparator?.code])

  const focusCode = state.area
  const focusPoint =
    focusCode && file ? readPoint(file, focusCode, sex, dim, periodIndex) : null
  const focusCell = focusCode ? derived[focusCode] : undefined
  const malePoint =
    focusCode && file ? readPoint(file, focusCode, "Male", dim, periodIndex) : null
  const femalePoint =
    focusCode && file ? readPoint(file, focusCode, "Female", dim, periodIndex) : null
  const cmp = selectedArea ? comparatorsFor(selectedArea) : null
  const nationPoint =
    cmp?.nation && file
      ? readPoint(file, cmp.nation.code, sex, dim, periodIndex)
      : null
  const ukPoint =
    cmp?.uk && file ? readPoint(file, cmp.uk.code, sex, dim, periodIndex) : null

  const hasMapFeatures = Boolean(geojson && geojson.features.length > 0)
  const showStrip = mapFamily === "le" || mapFamily === "hle" || family === "deprivation"
  const switcherViews = viewsFor(state.metric)
  const nationName = cmp?.nation?.name ?? null
  const hudArea = selectedArea ?? ukComparator
  const hudPoint =
    hudArea && file ? readPoint(file, hudArea.code, sex, dim, periodIndex) : null
  const scrubHud = hudArea
    ? `${hudArea.name} ${formatYears(hudPoint?.[0] ?? null)} ${unit}`
    : null
  const dualStory =
    state.view === "d2017" ||
    state.view === "d2019" ||
    state.view === "vs_nation" ||
    state.view === "sex_gap"
  const seriesSubject =
    selectedName ?? (!state.area && ukComparator ? ukComparator.name : null)
  const seriesHeading = dualStory
    ? seriesSubject
      ? `${seriesSubject} — levels over time`
      : "Levels over time"
    : undefined
  const ends = legendEnds(state.view)
  const birthPoint =
    focusCode && file ? readPoint(file, focusCode, sex, "birth", periodIndex) : null
  const age65Point =
    focusCode && file && mapFamily === "le"
      ? readPoint(file, focusCode, sex, "65", periodIndex)
      : null
  const showAges = Boolean(
    mapFamily === "le" && birthPoint?.[0] != null && age65Point?.[0] != null
  )
  const sexGap =
    state.view === "sex_gap"
      ? {
          male: malePoint?.[0] ?? null,
          female: femalePoint?.[0] ?? null,
          gap:
            malePoint?.[0] !== null &&
            malePoint?.[0] !== undefined &&
            femalePoint?.[0] !== null &&
            femalePoint?.[0] !== undefined
              ? malePoint[0] - femalePoint[0]
              : null,
          maleCi: formatCi(malePoint),
          femaleCi: formatCi(femalePoint),
        }
      : null
  const vsNation =
    state.view === "vs_nation" && cmp
      ? {
          label: cmp.nation?.name ?? cmp.uk?.name ?? "nation",
          delta:
            focusPoint?.[0] !== null &&
            focusPoint?.[0] !== undefined &&
            nationPoint?.[0] !== null &&
            nationPoint?.[0] !== undefined
              ? focusPoint[0] - nationPoint[0]
              : focusPoint?.[0] !== null &&
                  focusPoint?.[0] !== undefined &&
                  ukPoint?.[0] !== null &&
                  ukPoint?.[0] !== undefined
                ? focusPoint[0] - ukPoint[0]
                : null,
          ukDelta:
            cmp.nation &&
            ukPoint?.[0] !== null &&
            ukPoint?.[0] !== undefined &&
            focusPoint?.[0] !== null &&
            focusPoint?.[0] !== undefined
              ? focusPoint[0] - ukPoint[0]
              : null,
        }
      : null

  return (
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2 overflow-x-clip">
      <ContextChip
        state={state}
        mapMetric={mapMetric}
        nationName={nationName}
      />
      {switcherViews.length ? (
        <ViewSwitcher
          value={state.view}
          options={switcherViews}
          onChange={(view) => onChange({ view })}
        />
      ) : null}
      {showStrip ? (
        <DeprivationStrip
          area={selectedArea ?? null}
          deprivation={deprivation}
          emphasised={family === "deprivation"}
        />
      ) : null}
      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-2">
        {geoFailed ? (
          <EmptyNote title="Boundaries could not be loaded">
            The geography file for this cut did not load. Try another geography or reload.
          </EmptyNote>
        ) : showMap ? (
          <div className="flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-[#f8fafc]">
            <div className="relative h-[52dvh] min-h-[260px] w-full max-w-full lg:h-[min(68dvh,42rem)]">
              {hasMapFeatures && geojson ? (
                <ChoroplethMap
                  geojson={geojson}
                  colours={painted.colours}
                  hatch={hatch}
                  selected={state.area}
                  year={state.year}
                  view={state.view}
                  quietHover={scrubbing}
                  className="rounded-none"
                  onSelect={(code) => onChange({ area: code })}
                  formatHover={(code, name) => {
                    if (state.view === "sex_gap" && file) {
                      return sexGapHover(
                        name,
                        readPoint(file, code, "Male", dim, periodIndex),
                        readPoint(file, code, "Female", dim, periodIndex),
                        unit
                      )
                    }
                    const cell = derived[code]
                    const extra = cell?.hoverExtra
                    if (
                      (state.view === "d2017" ||
                        state.view === "d2019" ||
                        state.view === "vs_nation") &&
                      (cell?.value === null || cell?.value === undefined)
                    ) {
                      return `${name}\n${extra ?? "No figure in this cut"}`
                    }
                    const point = file ? readPoint(file, code, sex, dim, periodIndex) : null
                    return hoverText(name, point, unit, extra)
                  }}
                />
              ) : (
                <div className="relative flex h-full min-h-[220px] items-center justify-center bg-[#f8fafc]">
                  <div className="absolute inset-[12%] animate-pulse rounded-[40%] border border-slate-300/70" />
                  <p className="relative text-sm text-muted-foreground">
                    {geojson ? "No boundaries in this cut." : "Loading map…"}
                  </p>
                </div>
              )}
              {state.area ? (
                <div className="pointer-events-none absolute right-3 top-3 z-10 w-[min(100%-1.5rem,15rem)]">
                  <FocusReadout
                    figure
                    name={selectedName ?? state.area}
                    unit={unit}
                    point={focusPoint}
                    derivedValue={focusCell?.value}
                    view={state.view}
                    birthPoint={birthPoint}
                    age65Point={age65Point}
                    showAges={showAges}
                    divergence={divergence}
                    sexGap={sexGap}
                    vsNation={vsNation}
                    uncertainChange={
                      (state.view === "d2017" || state.view === "d2019") &&
                      Boolean(focusCell?.uncertain)
                    }
                    emphasiseCi={state.view === "ci"}
                  />
                </div>
              ) : (
                <div className="pointer-events-none absolute right-3 top-3 z-10 hidden w-[min(100%-1.5rem,12rem)] md:block">
                  <p className="rounded-md border border-slate-200/80 bg-white/90 px-2.5 py-1.5 text-sm shadow-sm backdrop-blur-sm dark:bg-slate-950/80">
                    Select an area
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-1.5 bg-white/90 px-3 pb-2 pt-1">
              {hasMapFeatures ? (
                <MapLegend
                  min={painted.min}
                  max={painted.max}
                  ramp={ramp}
                  unit={legendCaption(state.view, unit)}
                  zeroTick={diverging}
                  leftLabel={ends.left}
                  rightLabel={ends.right}
                  leftLabelShort={ends.leftShort}
                  rightLabelShort={ends.rightShort}
                  ariaLabel={ends.aria}
                  note={
                    state.view === "ci"
                      ? "Wider CI = less certain. Hatching and lighter fill mark wider 95% intervals."
                      : undefined
                  }
                />
              ) : null}
              {file && file.periods.length > 1 ? (
                <PeriodScrub
                  periods={file.periods}
                  year={state.year}
                  onYear={(year) => onChange({ year })}
                  hud={scrubHud}
                  onDragging={setScrubbing}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <CountryTable
            areas={areas}
            values={values}
            selected={state.area}
            onSelect={(code) => onChange({ area: code })}
            unit={legendCaption(state.view, unit)}
          />
        )}
        <SeriesPanel
          periods={file?.periods ?? []}
          series={series}
          year={state.year}
          unit={unit}
          heading={seriesHeading}
          onYear={(year) => onChange({ year })}
          emphasiseCi={state.view === "ci"}
          compareUi={state.view !== "sex_gap"}
          canCompare={Boolean(state.area) && state.compare.length < 2 && state.view !== "sex_gap"}
          onAddCompare={() => {
            if (!state.area) return
            if (state.compare.includes(state.area)) return
            onChange({ compare: [...state.compare, state.area].slice(0, 2) })
          }}
          onRemoveCompare={(code) =>
            onChange({ compare: state.compare.filter((item) => item !== code) })
          }
        />
      </div>
    </div>
  )
}

function emptySeries(periods: string[]): PackedPoint[] {
  return periods.map(() => [null, null, null])
}

function EmptyNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[180px] flex-1 items-center rounded-lg border border-dashed bg-muted/30 p-4 sm:p-6">
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
                {values[area.code] === null || values[area.code] === undefined
                  ? "–"
                  : `${values[area.code]?.toFixed(1)} ${unit}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

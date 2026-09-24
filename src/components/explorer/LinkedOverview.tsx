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
import {
  colourLookup,
  hoverText,
  sexGapHover,
  stableDomain,
} from "@/components/explorer/map-helpers"
import { MapLegend } from "@/components/explorer/MapLegend"
import { PeriodScrub, SeriesPanel } from "@/components/explorer/SeriesPanel"
import { ViewSwitcher } from "@/components/explorer/ViewSwitcher"
import {
  AVOIDABLE_RAMP,
  DIVERGING_RAMP,
  DIVERGING_RAMP_REVERSED,
  TEAL_RAMP,
} from "@/lib/explorer/colours"
import { familyOf, ONS_LINKS, SEGMENT_CALLOUT } from "@/lib/explorer/catalogue"
import { dimKey, geoUrl, readPoint, readSeries } from "@/lib/explorer/data"
import { comparatorsFor, deriveMap, NATION_COMPARATOR } from "@/lib/explorer/derive"
import { formatCi, formatYears } from "@/lib/explorer/format"
import {
  isDivergingView,
  legendCaption,
  legendEnds,
  PERIOD_PRECOVID,
  PERIOD_TROUGH,
  significanceNote,
  viewsFor,
} from "@/lib/explorer/views"
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
  // Mortality rates: fewer deaths reads teal, as longer life does for LE.
  const ramp = diverging
    ? mapFamily === "avoidable"
      ? DIVERGING_RAMP_REVERSED
      : DIVERGING_RAMP
    : mapFamily === "avoidable"
      ? AVOIDABLE_RAMP
      : TEAL_RAMP

  const unit = mapFamily === "avoidable" ? "per 100,000" : "years"

  // One scale for the whole scrub: Δ views only from their baseline onward.
  const domain = useMemo(() => {
    if (!file) return undefined
    const baseline =
      state.view === "d2017"
        ? file.periods.indexOf(PERIOD_PRECOVID)
        : state.view === "d2019"
          ? file.periods.indexOf(PERIOD_TROUGH)
          : 0
    const slices: Record<string, number | null>[] = []
    for (let i = Math.max(0, baseline); i < file.periods.length; i += 1) {
      const cells = deriveMap({
        view: state.view,
        file,
        areas,
        metric: mapMetric,
        sex,
        age: state.age,
        periodIndex: i,
      })
      const slice: Record<string, number | null> = {}
      for (const [code, cell] of Object.entries(cells)) slice[code] = cell.value
      slices.push(slice)
    }
    const step = unit === "years" ? (diverging ? 0.5 : 1) : 10
    return stableDomain(slices, diverging, step)
  }, [areas, diverging, file, mapMetric, sex, state.age, state.view, unit])

  const painted = useMemo(
    () => colourLookup(values, ramp, diverging, domain),
    [values, ramp, diverging, domain]
  )
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
  const ends = legendEnds(state.view, unit)
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
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-3 overflow-x-clip">
      <div className="min-w-0 space-y-2">
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
      </div>
      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col gap-4">
        {geoFailed ? (
          <EmptyNote title="Boundaries could not be loaded">
            The boundary file did not load. Try another geography or reload.
          </EmptyNote>
        ) : showMap ? (
          <div className="flex min-w-0 max-w-full shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-[#f8fafc]">
            <div className="relative h-[56dvh] min-h-[300px] w-full max-w-full shrink-0 lg:h-[clamp(420px,calc(100dvh-22rem),46rem)]">
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
                      return `${name}\n${extra ?? "No figure for this selection"}`
                    }
                    const point = file ? readPoint(file, code, sex, dim, periodIndex) : null
                    return hoverText(name, point, unit, extra)
                  }}
                />
              ) : (
                <div className="relative flex h-full min-h-[220px] items-center justify-center bg-[#f8fafc]">
                  <div className="absolute inset-[12%] animate-pulse rounded-[40%] border border-slate-300/70" />
                  <p className="relative text-sm text-muted-foreground">
                    {geojson ? "No boundaries for this geography." : "Loading map…"}
                  </p>
                </div>
              )}
              {state.area ? (
                <div
                  key={state.area}
                  className="pointer-events-none absolute right-2 top-2 z-10 w-[min(100%-1rem,12.5rem)] sm:right-4 sm:top-4 sm:w-[min(100%-2rem,16.5rem)]"
                >
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
                    age={state.age}
                    divergence={divergence}
                    sexGap={sexGap}
                    vsNation={vsNation}
                    significanceNote={
                      focusCell?.uncertain
                        ? significanceNote(state.view, vsNation?.label ?? nationName)
                        : null
                    }
                    emphasiseCi={state.view === "ci"}
                  />
                </div>
              ) : (
                <p className="pointer-events-none absolute right-4 top-3 z-10 hidden text-xs text-slate-500 md:block">
                  Select an area
                </p>
              )}
            </div>
            <div className="space-y-1 border-t border-slate-200/70 bg-white px-3 pb-2 pt-2 sm:px-4">
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
                  marker={
                    selectedArea && focusCell?.value != null
                      ? { value: focusCell.value, label: selectedArea.name }
                      : null
                  }
                  note={
                    state.view === "ci"
                      ? "Wider CI = less certain. Hatching and lighter fill mark wider 95% intervals."
                      : "Each area is shaded within its boundary."
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
        {showStrip ? (
          <DeprivationStrip
            area={selectedArea ?? null}
            deprivation={deprivation}
            emphasised={family === "deprivation"}
          />
        ) : mapFamily === "avoidable" ? (
          <SegmentCallout />
        ) : null}
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

function SegmentCallout() {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs leading-snug text-muted-foreground">
      <p>
        <span className="mr-2 inline-flex rounded-full border bg-white px-2 py-0.5 text-[11px] font-medium text-foreground">
          England only · IMD 2019, not IoD 2025
        </span>
        {SEGMENT_CALLOUT}
      </p>
      <p className="mt-1.5">
        <a className="underline underline-offset-2 hover:text-foreground" href={ONS_LINKS.segment}>
          OHID Segment tool
        </a>
        {" · "}
        <a
          className="underline underline-offset-2 hover:text-foreground"
          href={ONS_LINKS.segmentCommentary}
        >
          November 2025 commentary
        </a>
        . Not rebuilt here.
      </p>
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
                selected === area.code && "bg-slate-100"
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

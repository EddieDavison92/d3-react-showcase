"use client"

import { useMemo } from "react"
import { colourLookup, stableDomain } from "@/components/explorer/map-helpers"
import { DIVERGING_RAMP, DIVERGING_RAMP_REVERSED } from "@/lib/explorer/colours"
import { familyOf } from "@/lib/explorer/catalogue"
import { dimKey, readPoint } from "@/lib/explorer/data"
import { deriveMap, type DerivedCell } from "@/lib/explorer/derive"
import { isDivergingView, PERIOD_PRECOVID, PERIOD_TROUGH } from "@/lib/explorer/views"
import type { AreaRecord, ExplorerState, MetricId, PackedFile } from "@/lib/explorer/types"

export type MapModel = {
  periodIndex: number
  derived: Record<string, DerivedCell>
  values: Record<string, number | null>
  colours: Record<string, string>
  hatch?: Record<string, boolean>
  min: number
  max: number
  ramp: readonly string[]
  diverging: boolean
  unit: string
  /** Areas with a value, best first (highest LE, lowest death rate). */
  ranked: { area: AreaRecord; value: number }[]
  /** Level views are coloured either side of this reference figure. */
  centre: { value: number; label: string } | null
}

export function useMapModel(
  state: ExplorerState,
  mapMetric: MetricId,
  file: PackedFile | null,
  areas: AreaRecord[]
): MapModel | null {
  const family = familyOf(mapMetric)
  const periodIndex = file ? file.periods.indexOf(state.year) : -1

  const derived = useMemo(() => {
    if (!file || periodIndex < 0) return {}
    return deriveMap({
      view: state.view,
      file,
      areas,
      metric: mapMetric,
      sex: state.sex,
      age: state.age,
      periodIndex,
    })
  }, [areas, file, mapMetric, periodIndex, state.age, state.sex, state.view])

  const diverging = isDivergingView(state.view)
  const unit = family === "avoidable" ? "per 100,000" : "years"

  // Level views: colour either side of the UK figure (England for death rates,
  // which have no UK total), so places above and below stand apart. The spread
  // is fixed across periods at the 98th percentile of distance from that figure.
  const levelView = state.view === "absolute" || state.view === "ci"
  const refCode = family === "avoidable" ? "E92000001" : "K02000001"
  const refLabel = family === "avoidable" ? "England" : "UK"
  const dim = dimKey(mapMetric, state.age)
  const span = useMemo(() => {
    if (!file || !levelView) return null
    const gaps: number[] = []
    for (let i = 0; i < file.periods.length; i += 1) {
      const ref = readPoint(file, refCode, state.sex, dim, i)?.[0]
      if (ref == null) continue
      for (const area of areas) {
        const v = readPoint(file, area.code, state.sex, dim, i)?.[0]
        if (v != null) gaps.push(Math.abs(v - ref))
      }
    }
    if (!gaps.length) return null
    gaps.sort((a, b) => a - b)
    const step = unit === "years" ? 0.5 : 10
    return Math.max(step, Math.ceil(gaps[Math.floor(gaps.length * 0.98)] / step) * step)
  }, [areas, dim, file, levelView, refCode, state.sex, unit])

  // One colour scale across every period, so the scrub never rescales.
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
        sex: state.sex,
        age: state.age,
        periodIndex: i,
      })
      const slice: Record<string, number | null> = {}
      for (const [code, cell] of Object.entries(cells)) slice[code] = cell.value
      slices.push(slice)
    }
    const step = unit === "years" ? (diverging ? 0.5 : 1) : 10
    return stableDomain(slices, diverging, step)
  }, [areas, diverging, file, mapMetric, state.age, state.sex, state.view, unit])

  return useMemo(() => {
    if (!file || periodIndex < 0) return null
    const values: Record<string, number | null> = {}
    for (const [code, cell] of Object.entries(derived)) values[code] = cell.value
    // Fewer deaths reads teal, as longer life does for LE.
    const ramp = family === "avoidable" ? DIVERGING_RAMP_REVERSED : DIVERGING_RAMP
    const ref = span !== null ? (readPoint(file, refCode, state.sex, dim, periodIndex)?.[0] ?? null) : null
    const centre = ref !== null ? { value: ref, label: refLabel } : null
    const painted =
      centre && span !== null
        ? colourLookup(values, ramp, false, [centre.value - span, centre.value + span])
        : colourLookup(values, ramp, diverging, domain)
    let hatch: Record<string, boolean> | undefined
    if (state.view === "ci") {
      hatch = {}
      for (const [code, cell] of Object.entries(derived)) if (cell.uncertain) hatch[code] = true
    }
    const lowerIsBetter =
      family === "avoidable" && (state.view === "absolute" || state.view === "ci")
    const ranked = areas
      .map((area) => ({ area, value: values[area.code] }))
      .filter((row): row is { area: AreaRecord; value: number } => row.value != null)
      .sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value))
    return {
      periodIndex,
      derived,
      values,
      colours: painted.colours,
      hatch,
      min: painted.min,
      max: painted.max,
      ramp,
      diverging,
      unit,
      ranked,
      centre,
    }
  }, [areas, derived, dim, diverging, domain, family, file, periodIndex, refCode, refLabel, span, state.sex, state.view, unit])
}

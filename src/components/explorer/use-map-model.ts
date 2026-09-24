"use client"

import { useMemo } from "react"
import { colourLookup, stableDomain } from "@/components/explorer/map-helpers"
import {
  AVOIDABLE_RAMP,
  DIVERGING_RAMP,
  DIVERGING_RAMP_REVERSED,
  TEAL_RAMP,
} from "@/lib/explorer/colours"
import { familyOf } from "@/lib/explorer/catalogue"
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
    const ramp = diverging
      ? family === "avoidable"
        ? DIVERGING_RAMP_REVERSED
        : DIVERGING_RAMP
      : family === "avoidable"
        ? AVOIDABLE_RAMP
        : TEAL_RAMP
    const painted = colourLookup(values, ramp, diverging, domain)
    let hatch: Record<string, boolean> | undefined
    if (state.view === "ci") {
      hatch = {}
      for (const [code, cell] of Object.entries(derived)) if (cell.uncertain) hatch[code] = true
    }
    const lowerIsBetter = family === "avoidable" && state.view === "absolute"
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
    }
  }, [areas, derived, diverging, domain, family, file, periodIndex, state.view, unit])
}

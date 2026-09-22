import { familyOf, geosFor, hasAge, sexesFor } from "./catalogue"
import { nearestPeriod } from "./format"
import type {
  AreaRecord,
  ExplorerState,
  ExplorerWarning,
  LookupsFile,
  MetricId,
} from "./types"
import { WARNING_COPY } from "./warnings"

export type NestingContext = {
  lookups: LookupsFile
  periodsFor: (metric: MetricId) => string[]
  areaByCode: Map<string, AreaRecord>
}

function clone(state: ExplorerState): ExplorerState {
  return { ...state, compare: [...state.compare] }
}

export function applyExplorerChange(
  current: ExplorerState,
  patch: Partial<ExplorerState>,
  ctx: NestingContext
): { state: ExplorerState; warnings: ExplorerWarning[] } {
  const next = clone({ ...current, ...patch })
  const warnings: ExplorerWarning[] = []
  const family = familyOf(next.metric)
  const metricChanged = patch.metric !== undefined && patch.metric !== current.metric

  const geos = geosFor(next.metric)
  if (!geos.includes(next.geo)) {
    if (
      metricChanged &&
      family === "hle" &&
      current.geo === "ltla" &&
      !warnings.some((warning) => warning.id === "ltla-utla")
    ) {
      warnings.push(WARNING_COPY.ltlaUtla)
    }
    next.geo = geos[0]
  }

  const sexes = sexesFor(next.metric)
  if (sexes.length === 0) {
    next.sex = "Male"
  } else if (!sexes.includes(next.sex)) {
    warnings.push(WARNING_COPY.noPersons)
    next.sex = sexes[0]
  }

  if (!hasAge(next.metric)) {
    next.age = "birth"
  }

  const periods = ctx.periodsFor(next.metric)
  if (periods.length && !periods.includes(next.year)) {
    const snapped = nearestPeriod(next.year, periods)
    if (snapped !== next.year) warnings.push(WARNING_COPY.periodSnap)
    next.year = snapped
  }

  if (next.area) {
    const area = ctx.areaByCode.get(next.area)
    const parent = ctx.lookups.districtToUtla[next.area]

    if (family === "hle" && next.area.startsWith("E07") && parent) {
      warnings.push(hleSnapWarning(parent.name))
      next.area = parent.code
      next.geo = "utla"
    }

    if (family === "avoidable" && area && (area.nation === "S" || area.nation === "N")) {
      warnings.push(WARNING_COPY.avoidableEw)
      next.area = null
      next.geo = "ltla"
    }

    if (family === "deprivation") {
      const nation = area?.nation
      if (nation === "W") {
        warnings.push(WARNING_COPY.wimdEmpty)
      } else if (nation === "S" || nation === "N") {
        warnings.push(WARNING_COPY.scotNiDeprivation)
        next.area = null
      } else if (nation && nation !== "E") {
        warnings.push(WARNING_COPY.nationDeprivation)
        next.area = null
      }
    }

    if (next.geo === "ltla" && next.area?.startsWith("E10")) {
      next.geo = geos.includes("counties") ? "counties" : geos[0]
    }
    if (next.geo === "counties" && next.area && !next.area.startsWith("E10")) {
      if (metricChanged) next.area = null
    }
    if (next.geo === "region" && next.area && !next.area.startsWith("E12")) {
      if (metricChanged) next.area = null
    }
    if (next.geo === "country" && next.area && !/^([ENSW]92|K02)/.test(next.area)) {
      if (metricChanged) next.area = null
    }
    if (next.geo === "utla" && next.area?.startsWith("E07") && parent) {
      next.area = parent.code
    }
  }

  next.compare = next.compare.filter((code) => {
    if (code === next.area) return false
    const rec = ctx.areaByCode.get(code)
    if (!rec) return false
    if (family === "avoidable" && (rec.nation === "S" || rec.nation === "N")) return false
    if (family === "hle" && code.startsWith("E07")) return false
    return true
  }).slice(0, 2)

  if (family === "le") warnings.push(WARNING_COPY.periodLe)
  if (family === "hle") {
    warnings.push(WARNING_COPY.hleDevelopment)
    if (next.geo === "utla") warnings.push(WARNING_COPY.localAreasMix)
  }
  if (family === "le" && next.geo === "counties") warnings.push(WARNING_COPY.localAreasMix)
  if (family === "le" && next.geo === "country") warnings.push(WARNING_COPY.countryLe)
  if (family === "avoidable") warnings.push(WARNING_COPY.avoidableEw)
  if (family === "deprivation") {
    warnings.push(WARNING_COPY.deprivationNotCause)
  }

  const unique = new Map(warnings.map((w) => [w.id, w]))
  return { state: next, warnings: [...unique.values()] }
}

function hleSnapWarning(parentName: string): ExplorerWarning {
  return {
    ...WARNING_COPY.ltlaUtla,
    body: `${WARNING_COPY.ltlaUtla.body} Showing ${parentName}.`,
  }
}

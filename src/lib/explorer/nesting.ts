import { familyOf, geosFor, hasAge, sexesFor } from "./catalogue"
import { viewsFor } from "./views"
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


export function applyExplorerChange(
  current: ExplorerState,
  patch: Partial<ExplorerState>,
  ctx: NestingContext
): { state: ExplorerState; warnings: ExplorerWarning[] } {
  const next = { ...current, ...patch }
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

  const views = viewsFor(next.metric)
  if (views.length === 0) next.view = "absolute"
  else if (!views.includes(next.view)) next.view = views[0]

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
      if (nation === "W") warnings.push(WARNING_COPY.wimdEmpty)
      else if (nation === "S" || nation === "N") warnings.push(WARNING_COPY.scotNiDeprivation)
      else if (nation && nation !== "E" && nation !== "UK") {
        warnings.push(WARNING_COPY.nationDeprivation)
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

  const unique = new Map(warnings.map((w) => [w.id, w]))
  return { state: next, warnings: [...unique.values()] }
}

function hleSnapWarning(parentName: string): ExplorerWarning {
  return {
    ...WARNING_COPY.ltlaUtla,
    title: `Showing ${parentName}: healthy life expectancy isn’t published for districts`,
  }
}

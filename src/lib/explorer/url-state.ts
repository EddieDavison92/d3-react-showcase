import type { AgeId, ExplorerState, GeoId, MetricId, SexId, ViewId } from "./types"
import { compactPeriod, expandPeriod } from "./format"

export const DEFAULT_STATE: ExplorerState = {
  metric: "le",
  geo: "ltla",
  area: null,
  year: "2022 to 2024",
  sex: "Male",
  age: "birth",
  view: "abs",
  compare: [],
}

const METRICS = new Set<MetricId>([
  "le",
  "hle",
  "avoidable",
  "preventable",
  "treatable",
  "deprivation",
])
const GEOS = new Set<GeoId>(["ltla", "counties", "utla", "region", "country"])
const SEXES: Record<string, SexId> = {
  male: "Male",
  female: "Female",
  persons: "Persons",
}

export function parseSearchParams(params: URLSearchParams): Partial<ExplorerState> {
  const next: Partial<ExplorerState> = {}
  const metric = params.get("metric")
  if (metric && METRICS.has(metric as MetricId)) next.metric = metric as MetricId
  const geo = params.get("geo")
  if (geo && GEOS.has(geo as GeoId)) next.geo = geo as GeoId
  const area = params.get("area")
  if (area) next.area = area
  const year = params.get("year")
  if (year) next.year = expandPeriod(year)
  const sex = params.get("sex")
  if (sex && SEXES[sex.toLowerCase()]) next.sex = SEXES[sex.toLowerCase()]
  const age = params.get("age")
  if (age === "birth" || age === "65") next.age = age as AgeId
  const view = params.get("view")
  if (view === "abs" || view === "delta") next.view = view as ViewId
  const compare = params.get("compare")
  if (compare) next.compare = compare.split(",").filter(Boolean).slice(0, 2)
  return next
}

export function toSearchParams(state: ExplorerState): URLSearchParams {
  const params = new URLSearchParams()
  params.set("metric", state.metric)
  params.set("geo", state.geo)
  if (state.area) params.set("area", state.area)
  params.set("year", compactPeriod(state.year))
  if (state.sex) params.set("sex", state.sex.toLowerCase())
  if (state.age) params.set("age", state.age)
  if (state.view !== "abs") params.set("view", state.view)
  if (state.compare.length) params.set("compare", state.compare.join(","))
  return params
}

export function exploreHref(state: Partial<ExplorerState> = {}): string {
  const merged = { ...DEFAULT_STATE, ...state }
  return `/explore?${toSearchParams(merged).toString()}`
}

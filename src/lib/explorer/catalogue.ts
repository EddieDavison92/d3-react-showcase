import type { GeoId, MetricFamily, MetricId, SexId } from "./types"

/** Options for the measure picker. */
export const MEASURES: { id: MetricId; label: string; note: string }[] = [
  { id: "le", label: "Life expectancy", note: "UK · 2001–03 to 2022–24" },
  { id: "hle", label: "Healthy life expectancy", note: "UK · upper-tier in England" },
  { id: "avoidable", label: "Avoidable deaths", note: "England & Wales" },
  { id: "preventable", label: "Preventable deaths", note: "England & Wales" },
  { id: "treatable", label: "Treatable deaths", note: "England & Wales" },
]

export function familyOf(metric: MetricId): MetricFamily {
  if (metric === "preventable" || metric === "treatable") return "avoidable"
  return metric
}

export function geosFor(metric: MetricId): GeoId[] {
  switch (familyOf(metric)) {
    case "le":
      return ["ltla", "counties", "region", "country"]
    case "hle":
      return ["utla", "region", "country"]
    case "avoidable":
      return ["ltla", "counties", "region", "country"]
    case "deprivation":
      return ["ltla", "counties", "region", "country"]
  }
}

export function sexesFor(metric: MetricId): SexId[] {
  return familyOf(metric) === "avoidable" ? ["Male", "Female", "Persons"] : ["Male", "Female"]
}

export function hasAge(metric: MetricId): boolean {
  const family = familyOf(metric)
  return family === "le" || family === "deprivation"
}

export function geoLabel(geo: GeoId): string {
  switch (geo) {
    case "ltla":
      return "Local authorities"
    case "counties":
      return "English counties"
    case "utla":
      return "Upper-tier authorities"
    case "region":
      return "English regions"
    case "country":
      return "Nations"
  }
}

export function geoShort(geo: GeoId): string {
  switch (geo) {
    case "ltla":
      return "Local authority"
    case "counties":
      return "County"
    case "utla":
      return "Upper-tier"
    case "region":
      return "Region"
    case "country":
      return "Nation"
  }
}

export function metricLabel(metric: MetricId): string {
  switch (metric) {
    case "le":
      return "Life expectancy"
    case "hle":
      return "Healthy life expectancy"
    case "avoidable":
      return "Avoidable deaths"
    case "preventable":
      return "Preventable deaths"
    case "treatable":
      return "Treatable deaths"
    case "deprivation":
      return "Deprivation context"
  }
}

export function metricShort(metric: MetricId): string {
  switch (familyOf(metric)) {
    case "le":
      return "Period LE"
    case "hle":
      return "HLE"
    case "avoidable":
      return "Avoidable"
    case "deprivation":
      return "Deprivation"
  }
}

export const ONS_LINKS = {
  leDataset:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/datasets/lifeexpectancyforlocalareasoftheuk",
  leBulletin:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/lifeexpectancyforlocalareasoftheuk/between2001to2003and2022to2024",
  hleDataset:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/datasets/healthstatelifeexpectancyallagesuk/current",
  hleBulletin:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/healthandlifeexpectancies/bulletins/healthstatelifeexpectanciesuk/between2011to2013and2022to2024",
  avoidableDataset:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/causesofdeath/datasets/avoidablemortalityintheuk",
  avoidableBulletin:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/healthandsocialcare/causesofdeath/bulletins/avoidablemortalityinenglandandwales/2024",
  nationalLifeTables:
    "https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/bulletins/nationallifetablesunitedkingdom/2022to2024",
  iod: "https://www.gov.uk/government/statistics/english-indices-of-deprivation-2025",
  wimd: "https://www.gov.wales/welsh-index-multiple-deprivation-2025",
  ogl: "https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/",
  hleWatershed:
    "https://www.health.org.uk/reports-and-analysis/analysis/healthy-life-expectancy-trends-in-the-uk-a-watershed-moment",
  segment: "https://fingertips.phe.org.uk/profile/inequality-tools",
  segmentCommentary:
    "https://www.gov.uk/government/statistics/segment-tool-november-2025-update",
}

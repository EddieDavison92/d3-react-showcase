import type { CatalogueCard, GeoId, MetricFamily, MetricId, SexId } from "./types"

export const HLE_WATERSHED_HOOK =
  "Below state pension age (66) in 94% of UK areas for males and 91% for females, and below 55 in more than one in ten. Health Foundation, April 2026 — not a layer on this map."

export const CATALOGUE: CatalogueCard[] = [
  {
    id: "le",
    family: "le",
    title: "Period life expectancy",
    blurb:
      "Remaining years if current age-specific mortality rates persist. UK local areas, males and females, 2001–03 to 2022–24.",
    badges: ["UK · LTLA", "Accredited official statistics"],
    core: true,
  },
  {
    id: "hle",
    family: "hle",
    title: "Healthy life expectancy",
    blurb:
      "Years in good or very good self-rated health. England is upper-tier; not a district-for-district match to period LE.",
    hook: HLE_WATERSHED_HOOK,
    badges: ["UK · UTLA (Eng)", "Official statistics in development"],
  },
  {
    id: "avoidable",
    family: "avoidable",
    title: "Avoidable mortality",
    blurb:
      "Age-standardised rates from avoidable, preventable and treatable causes. England and Wales only.",
    badges: ["England & Wales only", "Persons available"],
  },
  {
    id: "deprivation",
    family: "deprivation",
    title: "Deprivation context",
    blurb:
      "Nation-specific indices as a strip on Explore, not a choropleth. England IoD 2025; Wales not bundled. Not a UK league and not a cause.",
    badges: ["England IoD25", "Wales not bundled", "Not causal"],
  },
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
      return "Lower-tier local areas"
    case "counties":
      return "England counties"
    case "utla":
      return "Upper-tier local areas"
    case "region":
      return "English regions"
    case "country":
      return "Country comparators"
  }
}

export function geoShort(geo: GeoId): string {
  switch (geo) {
    case "ltla":
      return "Lower-tier UK"
    case "counties":
      return "Counties"
    case "utla":
      return "Upper-tier"
    case "region":
      return "Regions"
    case "country":
      return "Countries"
  }
}

export function metricLabel(metric: MetricId): string {
  switch (metric) {
    case "le":
      return "Period life expectancy"
    case "hle":
      return "Healthy life expectancy"
    case "avoidable":
      return "Avoidable mortality"
    case "preventable":
      return "Preventable mortality"
    case "treatable":
      return "Treatable mortality"
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

/** Country context from the Health Foundation note. Not for the map scale. */
export const HLE_WATERSHED_INTL =
  "Of 21 high-income countries in that analysis (WHO GHO, 2011–21), the UK was one of five where healthy life expectancy fell. Those country ranks are not comparable with these local figures."

export const SEGMENT_CALLOUT =
  "England only. OHID Segment splits the deprivation gap in life expectancy by cause and age. It still uses IMD 2019 — not the IoD 2025 strip on this map."

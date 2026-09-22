import type { CatalogueCard, GeoId, MetricFamily, MetricId, SexId } from "./types"

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
      "Nation-specific indices shown as context, not as an explanation of life expectancy. Not a UK league table.",
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
      return ["ltla"]
  }
}

export function sexesFor(metric: MetricId): SexId[] {
  return familyOf(metric) === "avoidable"
    ? ["Male", "Female", "Persons"]
    : familyOf(metric) === "deprivation"
      ? []
      : ["Male", "Female"]
}

export function hasAge(metric: MetricId): boolean {
  return familyOf(metric) === "le"
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
}

export type MetricId =
  | "le"
  | "hle"
  | "avoidable"
  | "preventable"
  | "treatable"
  | "deprivation"

export type MetricFamily = "le" | "hle" | "avoidable" | "deprivation"

export type GeoId = "ltla" | "counties" | "utla" | "region" | "country"

export type SexId = "Male" | "Female" | "Persons"

export type AgeId = "birth" | "65"

export type ViewId = "absolute" | "d2017" | "d2019" | "vs_nation" | "sex_gap" | "ci"

export type NationId = "E" | "W" | "S" | "N" | "UK" | "?"

export type PackedPoint = [number | null, number | null, number | null]

export type AreaRecord = {
  code: string
  name: string
  nation: NationId | string
  grain: string
  areaType: string
}

export type DataMeta = {
  family: string
  source: string
  licence: string
  asOf: string
  version?: string
  unit: string
  download?: string
  coverage?: string
  officialStatisticsInDevelopment?: boolean
  notes?: string[]
}

export type PackedFile = {
  meta: DataMeta
  periods: string[]
  sexes: SexId[]
  ages?: AgeId[]
  conditions?: string[]
  areas: AreaRecord[]
  values: Record<string, Record<string, Record<string, PackedPoint[]>>>
}

export type DeprivationNation = {
  index: string
  asOf: string
  licence: string
  source: string
  url: string
  note: string
  higherRankIsLessDeprived: boolean
  areas: AreaRecord[]
  values: Record<
    string,
    {
      rankAverageScore: number
      averageScore: number
      propMostDeprived10: number
    }
  >
} | null

export type DeprivationFile = {
  meta: {
    family: string
    licence: string
    asOf: string
    notes: string[]
  }
  england: DeprivationNation
  wales: DeprivationNation
  scotland: DeprivationNation
  northernIreland: DeprivationNation
}

export type LookupsFile = {
  districtToUtla: Record<string, { code: string; name: string }>
  geoCodeAliases?: Record<string, string>
  unmatchedDistricts: string[]
  excludedFromLocalSeries: { code: string; name: string }[]
  notes: string[]
}

export type ExplorerState = {
  metric: MetricId
  geo: GeoId
  area: string | null
  year: string
  sex: SexId
  age: AgeId
  view: ViewId
  compare: string[]
}

export type WarningTone = "always" | "mismatch" | "empty"

export type ExplorerWarning = {
  id: string
  tone: WarningTone
  title: string
  body: string
}

export type CatalogueCard = {
  id: MetricId
  family: MetricFamily
  title: string
  blurb: string
  badges: string[]
  core?: boolean
  /** Short catalogue note. Not a map layer. */
  hook?: string
}

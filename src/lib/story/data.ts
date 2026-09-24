import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { cache } from "react"
import type { EvidenceFile } from "@/lib/explorer/evidence"
import { fit, OUTCOME_GROUP } from "@/lib/explorer/evidence"
import type { DeprivationFile, LookupsFile, PackedFile, SexId } from "@/lib/explorer/types"

export const UK = "K02000001"
export const NATIONS = [
  { code: "E92000001", name: "England", key: "E" },
  { code: "W92000004", name: "Wales", key: "W" },
  { code: "S92000003", name: "Scotland", key: "S" },
  { code: "N92000002", name: "Northern Ireland", key: "N" },
] as const

/** Start of the pre-stall window, end of the pre-stall window, pre-COVID. */
export const P_START = "2001 to 2003"
export const P_STALL = "2011 to 2013"
export const P_PRECOVID = "2017 to 2019"

async function readJson<T>(name: string): Promise<T> {
  const file = path.join(process.cwd(), "public", "data", name)
  return JSON.parse(await readFile(file, "utf-8")) as T
}

export const loadSources = cache(async () => {
  const [le, hle, evidence, deprivation, lookups, hex] = await Promise.all([
    readJson<PackedFile>("le.json"),
    readJson<PackedFile>("hle.json"),
    readJson<EvidenceFile>("evidence.json"),
    readJson<DeprivationFile>("deprivation.json"),
    readJson<LookupsFile>("lookups.json"),
    readJson<{ layout: string; hexes: Record<string, [number, number]> }>("hex.json"),
  ])
  return { le, hle, evidence, deprivation, lookups, hex }
})

export type Sources = Awaited<ReturnType<typeof loadSources>>

export function series(file: PackedFile, code: string, sex: SexId, dim = "birth"): (number | null)[] {
  return (file.values[code]?.[sex]?.[dim] ?? []).map((p) => p[0])
}

function d3median(values: number[]): number | null {
  if (!values.length) return null
  const v = [...values].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

export function mean(values: (number | null | undefined)[]): number | null {
  const v = values.filter((x): x is number => typeof x === "number")
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}

export function round(value: number | null, digits = 2): number | null {
  if (value === null) return null
  const f = 10 ** digits
  return Math.round(value * f) / f
}

/** IMD 2025 tenth for each English area in a grain (1 = most deprived). */
export function tenths(evidence: EvidenceFile, grain: "ltla" | "utla", keep: (code: string) => boolean) {
  const scored = Object.entries(evidence[grain])
    .filter(([code, f]) => f.imd !== undefined && keep(code))
    .sort((a, b) => b[1].imd - a[1].imd)
  const out = new Map<string, number>()
  scored.forEach(([code], i) => out.set(code, Math.min(10, Math.floor((i * 10) / scored.length) + 1)))
  return out
}

export type StoryArea = {
  code: string
  name: string
  nation: string
  q: number
  r: number
  /** Life expectancy at birth per period, 1 dp. */
  male: (number | null)[]
  female: (number | null)[]
  /** IMD 2025 tenth among English local authorities; null outside England. */
  decile: number | null
}

export type StoryData = Awaited<ReturnType<typeof getStoryData>>

export const getStoryData = cache(async () => {
  const { le, hle, evidence, hex } = await loadSources()
  const P = le.periods
  const iStart = P.indexOf(P_START)
  const iStall = P.indexOf(P_STALL)
  const iPre = P.indexOf(P_PRECOVID)
  const iNow = P.length - 1

  const local = le.areas.filter((a) => a.grain === "ltla" && hex.hexes[a.code])
  const decileOf = tenths(evidence, "ltla", (code) => Boolean(le.values[code]))
  const areas: StoryArea[] = local.map((a) => ({
    code: a.code,
    name: a.name,
    nation: String(a.nation),
    q: hex.hexes[a.code][0],
    r: hex.hexes[a.code][1],
    male: series(le, a.code, "Male").map((v) => round(v, 1)),
    female: series(le, a.code, "Female").map((v) => round(v, 1)),
    decile: decileOf.get(a.code) ?? null,
  }))

  // Chapter 1: the stall.
  const stall = (sex: SexId) => {
    const v = series(le, UK, sex)
    const pre = ((v[iStall] as number) - (v[iStart] as number)) / (iStall - iStart)
    const post = ((v[iPre] as number) - (v[iStall] as number)) / (iPre - iStall)
    const trendNow = (v[iStall] as number) + pre * (iNow - iStall)
    return {
      values: v,
      lci: (le.values[UK]?.[sex]?.birth ?? []).map((p) => p[1]),
      uci: (le.values[UK]?.[sex]?.birth ?? []).map((p) => p[2]),
      pre: round(pre, 3) as number,
      post: round(post, 3) as number,
      trendNow: round(trendNow, 2) as number,
      shortfall: round(trendNow - (v[iNow] as number), 2) as number,
      precovid: v[iPre] as number,
      now: v[iNow] as number,
    }
  }

  const lower = (sex: "male" | "female") =>
    areas.filter((a) => a[sex][iNow] !== null && a[sex][iStall] !== null && (a[sex][iNow] as number) < (a[sex][iStall] as number)).length

  // Chapter 3: deprivation tenths over time (England).
  const byDecile = (sex: "male" | "female") =>
    Array.from({ length: 10 }, (_, d) =>
      P.map((_, i) => round(mean(areas.filter((a) => a.decile === d + 1).map((a) => a[sex][i])), 2))
    )
  const decileMale = byDecile("male")
  const decileFemale = byDecile("female")
  const gap = (rows: (number | null)[][]) => P.map((_, i) => round((rows[9][i] ?? 0) - (rows[0][i] ?? 0), 2))

  // Chapter 4: healthy years by deprivation tenth (upper tier; HLE isn't published for districts).
  const hleI = hle.periods.length - 1
  const leForHle = le.periods.indexOf(hle.periods[hleI])
  const utlaDecile = tenths(evidence, "utla", (code) => Boolean(hle.values[code]))
  const lifelines = Array.from({ length: 10 }, (_, d) => {
    const codes = [...utlaDecile].filter(([, dec]) => dec === d + 1).map(([c]) => c)
    const pick = (file: PackedFile, sex: SexId, i: number) => mean(codes.map((c) => file.values[c]?.[sex]?.birth?.[i]?.[0]))
    return {
      decile: d + 1,
      n: codes.length,
      male: { healthy: round(pick(hle, "Male", hleI), 1), life: round(pick(le, "Male", leForHle), 1) },
      female: { healthy: round(pick(hle, "Female", hleI), 1), life: round(pick(le, "Female", leForHle), 1) },
    }
  })
  const ukHle = {
    periods: hle.periods,
    male: series(hle, UK, "Male"),
    female: series(hle, UK, "Female"),
  }

  // Chapter 5: circumstances alongside life expectancy.
  const factorPoints = evidence.indicators
    .filter((ind) => ind.group !== OUTCOME_GROUP)
    .map((ind) => {
      const pts = (sex: "male" | "female") =>
        areas
          .filter((a) => a.nation === "E" && evidence.ltla[a.code]?.[ind.key] !== undefined && a[sex][iNow] !== null)
          .map((a) => ({ code: a.code, x: evidence.ltla[a.code][ind.key], y: a[sex][iNow] as number }))
      return {
        indicator: ind,
        england: evidence.england[ind.key] ?? null,
        /** Factor value per area, aligned with `areas`; life expectancy is looked up client-side. */
        x: areas.map((a) => (a.nation === "E" ? (evidence.ltla[a.code]?.[ind.key] ?? null) : null)),
        male: { r: round(fit(pts("male"))?.r ?? 0, 3) as number },
        female: { r: round(fit(pts("female"))?.r ?? 0, 3) as number },
      }
    })
    .sort((a, b) => a.male.r - b.male.r)

  const nowMale = areas.filter((a) => a.male[iNow] !== null).sort((a, b) => (b.male[iNow] as number) - (a.male[iNow] as number))
  const nowFemale = areas.filter((a) => a.female[iNow] !== null).sort((a, b) => (b.female[iNow] as number) - (a.female[iNow] as number))
  const ends = (list: StoryArea[], sex: "male" | "female") => ({
    top: { code: list[0].code, name: list[0].name, value: list[0][sex][iNow] as number },
    bottom: { code: list.at(-1)!.code, name: list.at(-1)!.name, value: list.at(-1)![sex][iNow] as number },
    topTen: list.slice(0, 10).map((a) => a.code),
    bottomTen: list.slice(-10).map((a) => a.code),
  })

  const quantile = (list: StoryArea[], sex: "male" | "female", q: number) => {
    const v = list.map((a) => a[sex][iNow] as number).sort((a, b) => a - b)
    return v[Math.round(q * (v.length - 1))]
  }
  const air = Object.entries(evidence.ltla)
    .filter(([, f]) => f.airPollution !== undefined)
    .sort((a, b) => b[1].airPollution - a[1].airPollution)
    .slice(0, 30)
  const bottomTen = nowMale.slice(-10)
  const ciWidths = local
    .map((a) => {
      const p = le.values[a.code]?.Male?.birth?.[iNow]
      return p && p[1] !== null && p[2] !== null ? p[2] - p[1] : null
    })
    .filter((v): v is number => v !== null)
  const facts = {
    topTenEngland: nowMale.slice(0, 10).filter((a) => a.nation === "E").length,
    bottomTenScotland: bottomTen.filter((a) => a.nation === "S").length,
    iqrMale: round(quantile(nowMale, "male", 0.75) - quantile(nowMale, "male", 0.25), 1) as number,
    iqrFemale: round(quantile(nowFemale, "female", 0.75) - quantile(nowFemale, "female", 0.25), 1) as number,
    airTop30London: air.filter(([code]) => code.startsWith("E09")).length,
    englandAreas: areas.filter((a) => a.decile !== null).length,
    medianCiMale: round(d3median(ciWidths), 1) as number,
  }

  return {
    facts,
    periods: P,
    index: { start: iStart, stall: iStall, precovid: iPre, now: iNow },
    areas,
    extremes: { male: ends(nowMale, "male"), female: ends(nowFemale, "female") },
    stall: { male: stall("Male"), female: stall("Female") },
    lower: { male: lower("male"), female: lower("female"), of: areas.length },
    deciles: {
      male: decileMale,
      female: decileFemale,
      gapMale: gap(decileMale),
      gapFemale: gap(decileFemale),
      counts: Array.from({ length: 10 }, (_, d) => areas.filter((a) => a.decile === d + 1).length),
    },
    lifelines,
    hlePeriod: hle.periods[hleI],
    ukHle,
    factors: factorPoints,
    fetched: evidence.meta.fetched,
  }
})

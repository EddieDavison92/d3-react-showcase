import "server-only"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { cache } from "react"
import { OUTCOME_GROUP, type Indicator } from "@/lib/explorer/evidence"
import type { PackedFile, PackedPoint, SexId } from "@/lib/explorer/types"
import { loadSources, NATIONS, round, tenths, UK } from "@/lib/story/data"

const loadAvoidable = cache(async () => {
  const file = path.join(process.cwd(), "public", "data", "avoidable.json")
  return JSON.parse(await readFile(file, "utf-8")) as PackedFile
})

/** Areas with a report page: local authorities and English counties. */
export const reportAreas = cache(async () => {
  const { le } = await loadSources()
  return le.areas.filter((a) => a.grain === "ltla" || a.grain === "counties")
})

type Sex = "male" | "female"
const SEX: Record<Sex, SexId> = { male: "Male", female: "Female" }

export type AreaReport = NonNullable<Awaited<ReturnType<typeof getAreaReport>>>

export const getAreaReport = cache(async (code: string) => {
  const { le, hle, evidence, deprivation, lookups } = await loadSources()
  const avoidable = await loadAvoidable()
  const area = le.areas.find((a) => a.code === code && (a.grain === "ltla" || a.grain === "counties"))
  if (!area) return null

  const P = le.periods
  const iNow = P.length - 1
  const iStall = P.indexOf("2011 to 2013")
  const nation = NATIONS.find((n) => n.key === area.nation) ?? NATIONS[0]
  const parent = lookups.districtToUtla[code]
  const peers = le.areas.filter((a) => a.grain === area.grain)

  const pts = (c: string, sex: Sex, dim = "birth"): PackedPoint[] => le.values[c]?.[SEX[sex]]?.[dim] ?? []

  const bySex = (sex: Sex) => {
    const own = pts(code, sex)
    const now = own[iNow]?.[0] ?? null
    const all = peers
      .map((a) => ({ code: a.code, v: pts(a.code, sex)[iNow]?.[0] ?? null }))
      .filter((a): a is { code: string; v: number } => a.v !== null)
      .sort((a, b) => b.v - a.v)
    const rank = all.findIndex((a) => a.code === code) + 1

    // Healthy life expectancy: own figure, or the upper-tier area that contains it.
    const hleCode = hle.values[code] ? code : parent?.code
    const hleI = hle.periods.length - 1
    const leI = P.indexOf(hle.periods[hleI])
    const healthy = hleCode ? (hle.values[hleCode]?.[SEX[sex]]?.birth?.[hleI] ?? null) : null
    const lifeForHle = hleCode ? (le.values[hleCode]?.[SEX[sex]]?.birth?.[leI]?.[0] ?? null) : null
    const nationHealthy = hle.values[nation.code]?.[SEX[sex]]?.birth?.[hleI]?.[0] ?? null
    const nationLife = le.values[nation.code]?.[SEX[sex]]?.birth?.[leI]?.[0] ?? null

    return {
      series: own,
      nation: pts(nation.code, sex).map((p) => p[0]),
      uk: pts(UK, sex).map((p) => p[0]),
      now: own[iNow] ?? null,
      at65: pts(code, sex, "65")[iNow] ?? null,
      nationNow: pts(nation.code, sex)[iNow]?.[0] ?? null,
      ukNow: pts(UK, sex)[iNow]?.[0] ?? null,
      change: now !== null && own[iStall]?.[0] != null ? round(now - (own[iStall][0] as number), 1) : null,
      rank: rank > 0 ? rank : null,
      of: all.length,
      distribution: all.map((a) => [a.code, a.v] as [string, number]),
      healthy: healthy
        ? {
            value: healthy[0],
            lci: healthy[1],
            uci: healthy[2],
            life: lifeForHle,
            via: hleCode !== code ? (parent?.name ?? null) : null,
            nationHealthy,
            nationLife,
          }
        : null,
    }
  }

  // Deprivation (England lower tier only).
  const iod = area.nation === "E" ? deprivation.england?.values[code] : undefined
  const iodN = deprivation.england ? Object.keys(deprivation.england.values).length : 0
  const decileOf = tenths(evidence, "ltla", (c) => Boolean(le.values[c]))
  const decile = decileOf.get(code) ?? null
  const sameDecile = decile
    ? [...decileOf]
        .filter(([, d]) => d === decile)
        .map(([c]) => ({
          code: c,
          name: le.areas.find((a) => a.code === c)?.name ?? c,
          male: pts(c, "male")[iNow]?.[0] ?? null,
          female: pts(c, "female")[iNow]?.[0] ?? null,
        }))
    : []

  // Local circumstances from OHID (England).
  const grain = evidence.ltla[code] ? "ltla" : evidence.utla[code] ? "utla" : null
  const factors = grain
    ? evidence.indicators.map((indicator: Indicator) => {
        const values = Object.values(evidence[grain])
          .map((f) => f[indicator.key])
          .filter((v): v is number => typeof v === "number")
          .sort((a, b) => a - b)
        const value = evidence[grain][code]?.[indicator.key] ?? null
        const below = value === null ? 0 : values.filter((v) => v < value).length
        return {
          indicator,
          outcome: indicator.group === OUTCOME_GROUP,
          value,
          england: evidence.england[indicator.key] ?? null,
          min: values[0],
          max: values[values.length - 1],
          p25: values[Math.floor(values.length * 0.25)],
          p75: values[Math.floor(values.length * 0.75)],
          percentile: value === null ? null : below / Math.max(1, values.length - 1),
        }
      })
    : []

  // Avoidable deaths (England and Wales).
  const aI = avoidable.periods.length - 1
  const avoid = avoidable.values[code]
    ? (["avoidable", "preventable", "treatable"] as const).map((dim) => ({
        dim,
        value: avoidable.values[code]?.Persons?.[dim]?.[aI]?.[0] ?? null,
        nation: avoidable.values[nation.code]?.Persons?.[dim]?.[aI]?.[0] ?? null,
      }))
    : null

  return {
    code,
    name: area.name,
    grain: area.grain,
    nation,
    parent: parent && parent.code !== code ? parent : null,
    periods: P,
    index: { now: iNow, stall: iStall },
    hlePeriod: hle.periods[hle.periods.length - 1],
    male: bySex("male"),
    female: bySex("female"),
    deprivation: iod
      ? { rank: iod.rankAverageScore, of: iodN, score: iod.averageScore, decile }
      : decile
        ? { rank: null, of: iodN, score: null, decile }
        : null,
    sameDecile,
    factors,
    factorGrain: grain,
    avoidable: avoid ? { period: avoidable.periods[aI], rows: avoid } : null,
    fetched: evidence.meta.fetched,
  }
})

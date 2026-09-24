"use client"

import Link from "next/link"
import { Eyebrow } from "@/components/explorer/controls"
import { FactorProfile } from "@/components/explorer/FactorProfile"
import { TrendChart, type TrendSeries } from "@/components/explorer/TrendChart"
import type { MapModel } from "@/components/explorer/use-map-model"
import { familyOf, geoShort, metricLabel } from "@/lib/explorer/catalogue"
import { dimKey, readPoint, readSeries } from "@/lib/explorer/data"
import { comparatorsFor, iodDecile, NATION_COMPARATOR } from "@/lib/explorer/derive"
import type { EvidenceFile } from "@/lib/explorer/evidence"
import { compactPeriod, formatCi, formatSigned, formatYears } from "@/lib/explorer/format"
import { SEX_GAP_LABEL, significanceNote } from "@/lib/explorer/views"
import type {
  AreaRecord,
  DeprivationFile,
  ExplorerState,
  LookupsFile,
  MetricId,
  PackedFile,
  PackedPoint,
} from "@/lib/explorer/types"
import { cn } from "@/lib/utils"

const AREA_COLOUR = "#0f766e"
const NATION_COLOUR = "#64748b"
const UK_COLOUR = "#cbd5e1"
const NATION_CODES = new Set(Object.values(NATION_COMPARATOR).map((n) => n.code))

type Props = {
  state: ExplorerState
  mapMetric: MetricId
  file: PackedFile
  areas: AreaRecord[]
  model: MapModel
  le: PackedFile | null
  hle: PackedFile | null
  lookups: LookupsFile | null
  deprivation: DeprivationFile | null
  evidence: EvidenceFile | null
  onChange: (patch: Partial<ExplorerState>) => void
}

export function AreaPanel(props: Props) {
  const { state, file } = props
  const area =
    (state.area && props.areas.find((a) => a.code === state.area)) ||
    (state.area && file.areas.find((a) => a.code === state.area)) ||
    null
  return (
    <aside className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto">
      {area ? <AreaDetail {...props} area={area} /> : <Overview {...props} />}
    </aside>
  )
}

/* ---------- No area selected ---------- */

function Overview({ state, mapMetric, file, model, onChange }: Props) {
  const family = familyOf(mapMetric)
  const dim = dimKey(mapMetric, state.age)
  const digits = model.unit === "years" ? 1 : 0
  const [topLabel, bottomLabel] = listLabels(state.view, family === "avoidable")
  const top = model.ranked.slice(0, 5)
  const bottom = model.ranked.slice(-5).reverse()
  const spread =
    model.ranked.length > 1 && state.view === "absolute"
      ? Math.abs(model.ranked[0].value - model.ranked[model.ranked.length - 1].value)
      : null
  const nations = ["UK", "E", "W", "S", "N"]
    .map((key) => NATION_COMPARATOR[key])
    .map((n) => ({ ...n, point: readPoint(file, n.code, state.sex, dim, model.periodIndex) }))
    .filter((n) => n.point?.[0] != null)
  const signed = state.view !== "absolute" && state.view !== "ci"

  return (
    <div className="divide-y divide-slate-100">
      <section className="px-5 py-4">
        <Eyebrow>
          {subjectLine(state, mapMetric)} · {compactPeriod(state.year)}
        </Eyebrow>
        <ul className="mt-3 space-y-0.5">
          {nations.map((n) => (
            <li key={n.code}>
              <button
                type="button"
                onClick={() => onChange({ area: n.code })}
                className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between rounded px-2 py-1 text-sm hover:bg-slate-50"
              >
                <span className={n.code === "K02000001" ? "font-medium text-slate-900" : "text-slate-700"}>
                  {n.name}
                </span>
                <span className="tabular-nums text-slate-900">
                  {formatYears(n.point?.[0], digits)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {spread !== null ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            <span className="font-medium text-slate-900">
              {formatYears(spread, digits)} {model.unit}
            </span>{" "}
            between the highest and lowest of {model.ranked.length} areas.
          </p>
        ) : null}
      </section>
      {model.ranked.length > 10 ? (
        <section className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <RankList
            title={topLabel}
            rows={top}
            digits={digits}
            signed={signed}
            onPick={(code) => onChange({ area: code })}
          />
          <RankList
            title={bottomLabel}
            rows={bottom}
            digits={digits}
            signed={signed}
            onPick={(code) => onChange({ area: code })}
          />
        </section>
      ) : null}
      <p className="px-5 py-4 text-sm text-slate-500">
        Click an area on the map, or search, to see its trend, rank and risk factors.
      </p>
    </div>
  )
}

function RankList({
  title,
  rows,
  digits,
  signed,
  onPick,
}: {
  title: string
  rows: { area: AreaRecord; value: number }[]
  digits: number
  signed: boolean
  onPick: (code: string) => void
}) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-1.5">{title}</Eyebrow>
      <ol className="space-y-0.5">
        {rows.map((row) => (
          <li key={row.area.code}>
            <button
              type="button"
              onClick={() => onPick(row.area.code)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded px-2 py-1 text-left text-sm hover:bg-slate-50"
            >
              <span className="truncate text-slate-700">{row.area.name}</span>
              <span className="shrink-0 tabular-nums text-slate-900">
                {signed ? formatSigned(row.value, digits) : formatYears(row.value, digits)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

/* ---------- Area selected ---------- */

function AreaDetail({
  state,
  mapMetric,
  file,
  model,
  le,
  hle,
  lookups,
  deprivation,
  evidence,
  onChange,
  area,
}: Props & { area: AreaRecord }) {
  const family = familyOf(mapMetric)
  const dim = dimKey(mapMetric, state.age)
  const digits = model.unit === "years" ? 1 : 0
  const i = model.periodIndex
  const point = readPoint(file, area.code, state.sex, dim, i)
  const cell = model.derived[area.code]
  const cmp = comparatorsFor(area)
  const nationPoint = cmp.nation ? readPoint(file, cmp.nation.code, state.sex, dim, i) : null
  const ukPoint = cmp.uk ? readPoint(file, cmp.uk.code, state.sex, dim, i) : null
  const isNation = NATION_CODES.has(area.code)

  const rankIndex = model.ranked.findIndex((row) => row.area.code === area.code)
  const rank =
    state.view === "absolute" && rankIndex >= 0 && !isNation
      ? `${rankIndex + 1} of ${model.ranked.length}`
      : null

  const headline = headlineFor(state, point, cell?.value ?? null, family === "avoidable", cmp)
  const uncertain = cell?.uncertain ? significanceNote(state.view, cmp.nation?.name) : null

  const series: TrendSeries[] = [
    {
      code: area.code,
      name: area.name,
      colour: AREA_COLOUR,
      points: readSeries(file, area.code, state.sex, dim) ?? [],
      band: true,
    },
  ]
  if (cmp.nation) {
    series.push({
      code: cmp.nation.code,
      name: cmp.nation.name,
      colour: NATION_COLOUR,
      points: readSeries(file, cmp.nation.code, state.sex, dim) ?? [],
    })
  }
  if (cmp.uk) {
    series.push({
      code: cmp.uk.code,
      name: cmp.uk.name,
      colour: UK_COLOUR,
      points: readSeries(file, cmp.uk.code, state.sex, dim) ?? [],
    })
  }

  return (
    <div className="divide-y divide-slate-100">
      <section className="px-5 pb-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900">
              {area.name}
            </h2>
            <p className="text-xs text-slate-500">
              {isNation ? "Nation" : geoShort(areaGeo(area))} · {subjectLine(state, mapMetric, false)},{" "}
              <span className="whitespace-nowrap">{compactPeriod(state.year)}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ area: null })}
            className="-mr-2 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear area"
          >
            <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
              <path d="m2 2 8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-4xl font-semibold tracking-tight tabular-nums text-slate-900">
          {headline.value}
          <span className="ml-1.5 text-base font-normal tracking-normal text-slate-500">
            {headline.unit}
          </span>
        </p>
        <p className="mt-1 text-xs tabular-nums text-slate-500">{headline.sub}</p>
        {uncertain ? <p className="mt-1 text-xs text-slate-500">{uncertain}</p> : null}
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <Stat label={family === "avoidable" ? "Rank, lowest first" : "Rank, highest first"} value={rank ?? "–"} />
          <Stat
            label={cmp.nation ? `vs ${cmp.nation.name}` : "vs nation"}
            value={delta(point, nationPoint, digits, model.unit)}
          />
          <Stat label="vs UK" value={delta(point, ukPoint, digits, model.unit)} />
        </dl>
      </section>

      <section className="px-5 py-4">
        <Eyebrow className="mb-2">Trend</Eyebrow>
        <TrendChart
          periods={file.periods}
          series={series}
          year={state.year}
          digits={digits}
          onYear={(year) => onChange({ year })}
        />
      </section>

      {family === "le" || family === "hle" ? (
        <HealthSection
          area={area}
          state={state}
          le={le}
          hle={hle}
          lookups={lookups}
          showing={family}
        />
      ) : null}

      <DeprivationSection area={area} deprivation={deprivation} />

      {evidence && area.nation === "E" && !isNation ? (
        <section className="px-5 py-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <Eyebrow>Risk factors vs England</Eyebrow>
            <Link
              href={`/evidence?area=${area.code}&sex=${state.sex.toLowerCase()}`}
              className="text-xs font-medium text-teal-800 hover:underline"
            >
              How these relate →
            </Link>
          </div>
          <FactorProfile evidence={evidence} code={area.code} />
        </section>
      ) : null}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums text-slate-900">{value}</dd>
    </div>
  )
}

function HealthSection({
  area,
  state,
  le,
  hle,
  lookups,
  showing,
}: {
  area: AreaRecord
  state: ExplorerState
  le: PackedFile | null
  hle: PackedFile | null
  lookups: LookupsFile | null
  showing: "le" | "hle"
}) {
  if (!le || !hle) return null
  const parent = lookups?.districtToUtla[area.code]
  const code = hle.values[area.code] ? area.code : parent?.code
  if (!code) return null
  const leI = le.periods.indexOf(state.year)
  const hleI = hle.periods.indexOf(state.year)
  const lifeYears = readPoint(le, code, state.sex, "birth", leI)?.[0] ?? null
  const healthyYears = readPoint(hle, code, state.sex, "birth", hleI)?.[0] ?? null
  if (lifeYears === null || healthyYears === null) return null
  const poor = lifeYears - healthyYears
  const share = healthyYears / lifeYears
  const via = code !== area.code ? (parent?.name ?? null) : null

  return (
    <section className="px-5 py-4">
      <Eyebrow className="mb-2">Years in good health, at birth</Eyebrow>
      <div className="flex h-2 overflow-hidden rounded-full bg-slate-100">
        <span className="h-full bg-teal-700" style={{ width: `${share * 100}%` }} />
        <span className="ml-0.5 h-full flex-1 bg-amber-400" />
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-teal-700" />
            Good health
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">
            {formatYears(healthyYears)} years
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Not in good health
          </dt>
          <dd className="font-medium tabular-nums text-slate-900">{formatYears(poor)} years</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-slate-500">
        {state.sex === "Male" ? "Males" : "Females"}, {compactPeriod(state.year)}
        {via ? ` · ${via} figure` : ""}
        {showing === "le" ? "" : " · life expectancy minus healthy life expectancy"}
      </p>
    </section>
  )
}

function DeprivationSection({
  area,
  deprivation,
}: {
  area: AreaRecord
  deprivation: DeprivationFile | null
}) {
  const pack = area.nation === "E" ? deprivation?.england : null
  const rec = pack?.values[area.code]
  if (!pack || !rec) return null
  const n = Object.keys(pack.values).length
  const decile = iodDecile(rec.rankAverageScore, n)
  return (
    <section className="px-5 py-4">
      <Eyebrow className="mb-2">Deprivation · IoD 2025</Eyebrow>
      <div className="flex gap-0.5" role="img" aria-label={`Decile ${decile} of 10, 1 is most deprived`}>
        {Array.from({ length: 10 }, (_, d) => (
          <span
            key={d}
            className={cn(
              "h-2 flex-1 rounded-sm",
              d + 1 === decile ? "bg-slate-900" : "bg-slate-200"
            )}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>Most deprived</span>
        <span>Least deprived</span>
      </div>
      <p className="mt-2 text-sm text-slate-700">
        {decilePhrase(decile)} · rank{" "}
        <span className="tabular-nums">{rec.rankAverageScore}</span> of {n} English local
        authorities.
      </p>
    </section>
  )
}

/* ---------- helpers ---------- */

function headlineFor(
  state: ExplorerState,
  point: PackedPoint | null,
  derived: number | null,
  rate: boolean,
  cmp: ReturnType<typeof comparatorsFor>
): { value: string; unit: string; sub: string } {
  const digits = rate ? 0 : 1
  const unit = rate ? "per 100,000" : "years"
  const level = `${formatYears(point?.[0], digits)} ${unit} in ${compactPeriod(state.year)}`
  switch (state.view) {
    case "d2017":
      return { value: formatSigned(derived, digits), unit, sub: `Change since 2017–19 · ${level}` }
    case "d2019":
      return { value: formatSigned(derived, digits), unit, sub: `Change since 2019–21 · ${level}` }
    case "vs_nation":
      return {
        value: formatSigned(derived, digits),
        unit,
        sub: `Gap to ${cmp.nation?.name ?? "own nation"} · ${level}`,
      }
    case "sex_gap":
      return { value: formatSigned(derived, digits), unit, sub: SEX_GAP_LABEL }
    default:
      return { value: formatYears(point?.[0], digits), unit, sub: formatCi(point) || "No interval published" }
  }
}

function delta(a: PackedPoint | null, b: PackedPoint | null, digits: number, unit: string): string {
  if (a?.[0] == null || b?.[0] == null) return "–"
  return `${formatSigned(a[0] - b[0], digits)}${unit === "years" ? " yrs" : ""}`
}

function listLabels(view: ExplorerState["view"], rate: boolean): [string, string] {
  switch (view) {
    case "d2017":
    case "d2019":
      return rate ? ["Biggest rises", "Biggest falls"] : ["Biggest gains", "Biggest falls"]
    case "vs_nation":
      return rate ? ["Most above nation", "Most below nation"] : ["Most above nation", "Most below nation"]
    case "sex_gap":
      return ["Smallest gap", "Largest gap"]
    default:
      return rate ? ["Lowest", "Highest"] : ["Highest", "Lowest"]
  }
}

function subjectLine(state: ExplorerState, metric: MetricId, withMetric = true): string {
  const family = familyOf(metric)
  const sex = state.view === "sex_gap" ? "Male − female" : state.sex
  const age = family === "le" ? (state.age === "65" ? " at 65" : " at birth") : ""
  return withMetric ? `${metricLabel(metric)} · ${sex}${age}` : `${sex}${age}`
}

function areaGeo(area: AreaRecord) {
  if (area.grain === "counties") return "counties" as const
  if (area.grain === "region") return "region" as const
  return "ltla" as const
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

function decilePhrase(decile: number): string {
  if (decile === 1) return "Most deprived tenth"
  if (decile === 10) return "Least deprived tenth"
  return `${ordinal(decile)} most deprived tenth`
}

"use client"

import Link from "next/link"
import { TrendChart, type TrendSeries } from "@/components/explorer/TrendChart"
import type { MapModel } from "@/components/explorer/use-map-model"
import { familyOf, geoShort, metricLabel } from "@/lib/explorer/catalogue"
import { dimKey, readPoint, readSeries } from "@/lib/explorer/data"
import { comparatorsFor, NATION_COMPARATOR } from "@/lib/explorer/derive"
import { compactPeriod, formatCi, formatSigned, formatYears } from "@/lib/explorer/format"
import { SEX_GAP_LABEL, significanceNote } from "@/lib/explorer/views"
import type { AreaRecord, ExplorerState, MetricId, PackedFile, PackedPoint } from "@/lib/explorer/types"
import { FEMALE, INK_3, MALE } from "@/lib/story/palette"
import { cn } from "@/lib/utils"

const NATION_CODES = new Set(Object.values(NATION_COMPARATOR).map((n) => n.code))

type Props = {
  state: ExplorerState
  mapMetric: MetricId
  file: PackedFile
  areas: AreaRecord[]
  model: MapModel
  onChange: (patch: Partial<ExplorerState>) => void
}

export function AreaCard(props: Props) {
  const { state, file, areas } = props
  const area =
    (state.area && (areas.find((a) => a.code === state.area) ?? file.areas.find((a) => a.code === state.area))) || null
  return area ? <Detail {...props} area={area} /> : <Overview {...props} />
}

function Overview({ state, mapMetric, file, model, onChange }: Props) {
  const dim = dimKey(mapMetric, state.age)
  const digits = model.unit === "years" ? 1 : 0
  const rate = familyOf(mapMetric) === "avoidable"
  const signed = state.view !== "absolute" && state.view !== "ci"
  const [topLabel, bottomLabel] = listLabels(state.view, rate)
  const nations = ["UK", "E", "W", "S", "N"]
    .map((k) => NATION_COMPARATOR[k])
    .map((n) => ({ ...n, v: readPoint(file, n.code, state.sex, dim, model.periodIndex)?.[0] ?? null }))
    .filter((n) => n.v !== null)
  const spread =
    state.view === "absolute" && model.ranked.length > 1
      ? Math.abs(model.ranked[0].value - model.ranked[model.ranked.length - 1].value)
      : null

  return (
    <div className="space-y-6">
      <div>
        <p className="kicker">{compactPeriod(state.year)}</p>
        <h2 className="mt-1 display text-2xl text-ink">{metricLabel(mapMetric)}</h2>
        <p className="text-sm text-ink-3">{subject(state, mapMetric)}</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3">
        {nations.map((n) => (
          <li key={n.code}>
            <button type="button" onClick={() => onChange({ area: n.code, geo: "country" })} className="group text-left">
              <span className="block text-2xs text-ink-3 group-hover:text-ink-2">{n.name}</span>
              <span className="display text-2xl tabular text-ink">{formatYears(n.v, digits)}</span>
            </button>
          </li>
        ))}
      </ul>
      {spread !== null ? (
        <p className="border-t border-line pt-4 text-sm text-ink-2">
          <span className="display text-xl text-ink">{formatYears(spread, digits)}</span> {model.unit} between the
          highest and lowest of {model.ranked.length} areas.
        </p>
      ) : null}
      {model.ranked.length > 10 ? (
        <div className="grid grid-cols-1 gap-5 border-t border-line pt-4">
          <RankList title={topLabel} rows={model.ranked.slice(0, 5)} digits={digits} signed={signed} onPick={(c) => onChange({ area: c })} />
          <RankList title={bottomLabel} rows={model.ranked.slice(-5).reverse()} digits={digits} signed={signed} onPick={(c) => onChange({ area: c })} />
        </div>
      ) : null}
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
    <div>
      <p className="kicker mb-1.5">{title}</p>
      <ol>
        {rows.map((row) => (
          <li key={row.area.code}>
            <button
              type="button"
              onClick={() => onPick(row.area.code)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm hover:bg-white"
            >
              <span className="truncate text-ink-2">{row.area.name}</span>
              <span className="shrink-0 tabular text-ink">{signed ? formatSigned(row.value, digits) : formatYears(row.value, digits)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Detail({ state, mapMetric, file, model, onChange, area }: Props & { area: AreaRecord }) {
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
  const rankIndex = model.ranked.findIndex((r) => r.area.code === area.code)
  const colour = state.sex === "Female" ? FEMALE : state.sex === "Male" ? MALE : "#0f6b5c"
  const headline = headlineFor(state, point, cell?.value ?? null, digits, family === "avoidable" ? "per 100,000" : "years", cmp)
  const note = cell?.uncertain ? significanceNote(state.view, cmp.nation?.name) : null
  const reportable = area.grain === "ltla" || area.grain === "counties"

  const series: TrendSeries[] = [
    { code: area.code, name: area.name, colour, points: readSeries(file, area.code, state.sex, dim) ?? [], band: true },
  ]
  if (cmp.nation) series.push({ code: cmp.nation.code, name: cmp.nation.name, colour: INK_3, points: readSeries(file, cmp.nation.code, state.sex, dim) ?? [] })
  if (cmp.uk) series.push({ code: cmp.uk.code, name: cmp.uk.name, colour: "#bdbcb5", points: readSeries(file, cmp.uk.code, state.sex, dim) ?? [] })

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="kicker">{isNation ? "Nation" : geoShort(area.grain === "counties" ? "counties" : "ltla")}</p>
          <h2 className="mt-1 display text-3xl leading-tight text-ink">{area.name}</h2>
        </div>
        <button
          type="button"
          onClick={() => onChange({ area: null })}
          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-white hover:text-ink"
          aria-label="Clear area"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="m2 2 8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div>
        <p className="text-sm text-ink-3">
          {subject(state, mapMetric)}, {compactPeriod(state.year)}
        </p>
        <p className="mt-1 display text-6xl tabular text-ink">
          {headline.value}
          <span className="ml-2 font-sans text-base font-normal tracking-normal text-ink-3">{headline.unit}</span>
        </p>
        <p className="mt-1 text-xs tabular text-ink-3">{headline.sub}</p>
        {note ? <p className="mt-1 text-xs text-ink-3">{note}</p> : null}
      </div>
      <dl className="grid grid-cols-3 gap-3 border-y border-line py-3 text-sm">
        <Stat label="Rank" value={state.view === "absolute" && rankIndex >= 0 && !isNation ? `${rankIndex + 1}/${model.ranked.length}` : "–"} />
        <Stat label={cmp.nation ? `vs ${cmp.nation.name}` : "vs nation"} value={delta(point, nationPoint, digits)} tone invert={family === "avoidable"} />
        <Stat label="vs UK" value={delta(point, ukPoint, digits)} tone invert={family === "avoidable"} />
      </dl>
      <TrendChart periods={file.periods} series={series} year={state.year} digits={digits} onYear={(year) => onChange({ year })} />
      {reportable ? (
        <Link
          href={`/area/${area.code}`}
          className="group flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-sm font-medium text-paper transition hover:bg-ink/85"
        >
          Full report for {area.name}
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      ) : null}
    </div>
  )
}

function Stat({ label, value, tone, invert }: { label: string; value: string; tone?: boolean; invert?: boolean }) {
  const below = tone && value.startsWith("−")
  const above = tone && value.startsWith("+")
  const negative = invert ? above : below
  const positive = invert ? below : above
  return (
    <div className="min-w-0">
      <dt className="truncate text-2xs text-ink-3">{label}</dt>
      <dd className={cn("mt-0.5 font-medium tabular", negative ? "text-loss" : positive ? "text-brand" : "text-ink")}>{value}</dd>
    </div>
  )
}

function headlineFor(
  state: ExplorerState,
  point: PackedPoint | null,
  derived: number | null,
  digits: number,
  unit: string,
  cmp: ReturnType<typeof comparatorsFor>
) {
  const level = `${formatYears(point?.[0], digits)} ${unit === "years" ? "years" : ""} in ${compactPeriod(state.year)}`.replace("  ", " ")
  switch (state.view) {
    case "d2017":
      return { value: formatSigned(derived, digits), unit, sub: `Change since 2017–19 · now ${level}` }
    case "d2019":
      return { value: formatSigned(derived, digits), unit, sub: `Change since 2019–21 · now ${level}` }
    case "vs_nation":
      return { value: formatSigned(derived, digits), unit, sub: `Gap to ${cmp.nation?.name ?? "own nation"} · ${level}` }
    case "sex_gap":
      return { value: formatSigned(derived, digits), unit, sub: SEX_GAP_LABEL }
    default:
      return { value: formatYears(point?.[0], digits), unit, sub: formatCi(point) || "No interval published" }
  }
}

function delta(a: PackedPoint | null, b: PackedPoint | null, digits: number): string {
  if (a?.[0] == null || b?.[0] == null) return "–"
  return formatSigned(a[0] - b[0], digits)
}

function subject(state: ExplorerState, metric: MetricId): string {
  const sex = state.view === "sex_gap" ? "Men minus women" : state.sex === "Male" ? "Men" : state.sex === "Female" ? "Women" : "All persons"
  const age = familyOf(metric) === "le" ? (state.age === "65" ? " at 65" : " at birth") : ""
  return `${sex}${age}`
}

function listLabels(view: ExplorerState["view"], rate: boolean): [string, string] {
  switch (view) {
    case "d2017":
    case "d2019":
      return rate ? ["Biggest rises", "Biggest falls"] : ["Biggest gains", "Biggest falls"]
    case "vs_nation":
      return ["Most above own nation", "Most below own nation"]
    case "sex_gap":
      return ["Smallest gap", "Largest gap"]
    default:
      return rate ? ["Lowest rates", "Highest rates"] : ["Highest", "Lowest"]
  }
}

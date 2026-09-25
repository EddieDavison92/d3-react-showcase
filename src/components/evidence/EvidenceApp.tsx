"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CorrelationBars, type CorrelationRow } from "@/components/evidence/CorrelationBars"
import { DeprivationGradient, SEX_COLOURS } from "@/components/evidence/DeprivationGradient"
import { FactorScatter } from "@/components/evidence/FactorScatter"
import { PlaceSearch } from "@/components/story/PlaceSearch"
import { SexToggle } from "@/components/story/SexToggle"
import { loadLe } from "@/lib/explorer/data"
import {
  byDeprivationTenth,
  fit,
  formatIndicator,
  loadEvidence,
  OUTCOME_GROUP,
  pairs,
  type EvidenceFile,
} from "@/lib/explorer/evidence"
import { compactPeriod, formatSigned, formatYears } from "@/lib/explorer/format"
import { exploreHref } from "@/lib/explorer/url-state"
import type { PackedFile, SexId } from "@/lib/explorer/types"

const DEFAULT_FACTOR = "childPoverty"

export function EvidenceApp() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [le, setLe] = useState<PackedFile | null>(null)
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    loadLe().then(setLe).catch(() => setFailed(true))
    loadEvidence().then(setEvidence).catch(() => setFailed(true))
  }, [])

  const sex: SexId = params.get("sex") === "female" ? "Female" : "Male"
  const area = params.get("area")
  const factor = params.get("factor") ?? DEFAULT_FACTOR

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      router.replace(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  const periodIndex = le ? le.periods.length - 1 : -1
  const period = le ? le.periods[periodIndex] : ""

  // Order is fixed by the male correlation so switching sex never reshuffles the list.
  const correlations = useMemo(() => {
    if (!le || !evidence) return []
    const r = (key: string, s: SexId) => fit(pairs({ evidence, le, grain: "ltla", key, sex: s, periodIndex }))
    return evidence.indicators
      .map((indicator) => {
        const model = r(indicator.key, sex)
        const order = r(indicator.key, "Male")?.r ?? 0
        return model ? { indicator, r: model.r, n: model.n, order } : null
      })
      .filter((row): row is CorrelationRow & { order: number } => row !== null)
      .sort((a, b) => a.order - b.order)
  }, [evidence, le, periodIndex, sex])

  const deciles = useMemo(
    () => (le && evidence ? byDeprivationTenth(evidence, le, periodIndex) : []),
    [evidence, le, periodIndex]
  )

  const indicator =
    evidence?.indicators.find((i) => i.key === factor) ??
    evidence?.indicators.find((i) => i.key === DEFAULT_FACTOR)
  const points = useMemo(
    () =>
      le && evidence && indicator
        ? pairs({ evidence, le, grain: "ltla", key: indicator.key, sex, periodIndex })
        : [],
    [evidence, indicator, le, periodIndex, sex]
  )
  const model = useMemo(() => fit(points), [points])
  // One y range for both sexes so the toggle moves dots, not the axis.
  const yDomain = useMemo((): [number, number] | undefined => {
    if (!le) return undefined
    const vals = Object.keys(evidence?.ltla ?? {}).flatMap((code) =>
      (["Male", "Female"] as const).map((s) => le.values[code]?.[s]?.birth?.[periodIndex]?.[0] ?? null)
    )
    const finite = vals.filter((v): v is number => v !== null)
    return finite.length ? [Math.min(...finite), Math.max(...finite)] : undefined
  }, [evidence, le, periodIndex])
  const focus = points.find((p) => p.code === area) ?? null

  // Links from the story land on the chart. The page loads its data after
  // navigation, so the browser can't find the anchor itself.
  const ready = Boolean(le && evidence && indicator)
  useEffect(() => {
    if (!ready || window.location.hash !== "#factor") return
    // Desktop: the chart column is sticky, so scroll to its section. Phones: straight to the chart.
    const desktop = window.matchMedia("(min-width: 1024px)").matches
    document.getElementById(desktop ? "factors" : "factor")?.scrollIntoView({ block: "start" })
  }, [ready])

  // On phones the chart sits below the list, so bring it into view on pick.
  const pickFactor = (key: string) => {
    update({ factor: key })
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("factor")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  if (!le || !evidence || !indicator) {
    return (
      <p className="py-32 text-center text-sm text-ink-3">
        {failed ? "The data didn't load. Reload the page to try again." : "Loading…"}
      </p>
    )
  }

  const first = deciles[0]
  const last = deciles[deciles.length - 1]
  const gap = (s: "male" | "female") =>
    first?.[s] != null && last?.[s] != null ? last[s]! - first[s]! : null
  const drivers = correlations.filter((c) => c.indicator.group !== OUTCOME_GROUP)
  const outcomes = correlations.filter((c) => c.indicator.group === OUTCOME_GROUP)
  const r2 = model ? Math.round(model.r * model.r * 100) : null
  const expected = focus && model ? model.intercept + model.slope * focus.x : null
  const sexWord = sex === "Male" ? "male" : "female"
  const yLabel = `${sex === "Male" ? "Men" : "Women"}: life expectancy, ${compactPeriod(period)}`
  const searchable = points.map((p) => ({ code: p.code, name: p.name, geo: "ltla" as const }))

  return (
    <div className="mx-auto w-full max-w-6xl pb-16 pt-10 sm:pt-14">
      <header>
        <div className="max-w-3xl animate-rise">
          <p className="kicker">Evidence</p>
          <h1 className="mt-3 display text-5xl text-ink sm:text-6xl">
            What travels with life expectancy
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-2">
            {points.length} English local authorities, their life expectancy at birth, and fifteen measures of local
            circumstance from OHID. Associations between places, not proof of cause.
          </p>
        </div>
      </header>

      <section className="mt-16 grid grid-cols-1 gap-10 border-t border-line pt-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
        <div>
          <h2 className="display text-3xl text-ink">The deprivation gradient</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-3">
            Local authorities in ten equal groups by IMD 2025 score. Each point is the mean life expectancy of one
            group, {compactPeriod(period)}; areas are not weighted by population.
          </p>
          <dl className="mt-6 space-y-4">
            {(["male", "female"] as const).map((s) => (
              <div key={s} className="border-t border-line pt-3">
                <dt className="flex items-center gap-2 text-sm text-ink-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: SEX_COLOURS[s === "male" ? "Male" : "Female"] }} />
                  {s === "male" ? "Men" : "Women"}, most vs least deprived
                </dt>
                <dd className="mt-1 display text-5xl tabular text-ink">
                  {formatYears(gap(s))}
                  <span className="ml-1.5 font-sans text-sm tracking-normal text-ink-3">years</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <DeprivationGradient rows={deciles} />
      </section>

      <section id="factors" className="mt-20 scroll-mt-16 border-t border-line pt-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="display text-3xl text-ink">How closely each one tracks</h2>
              <SexToggle value={sex === "Male" ? "male" : "female"} onChange={(v) => update({ sex: v })} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-3">
              Pearson r with {sexWord} life expectancy across local authorities. Near −1, places with more of it
              reliably have shorter lives. Pick a measure to plot it.
            </p>
            <div className="mt-6 space-y-6">
              <CorrelationBars title="Circumstances and behaviour" rows={drivers} selected={indicator.key} onSelect={pickFactor} />
              <CorrelationBars title="Deaths by cause: part of life expectancy itself" rows={outcomes} selected={indicator.key} onSelect={pickFactor} />
            </div>
          </div>

          <div id="factor" className="min-w-0 scroll-mt-20 lg:sticky lg:top-20 lg:self-start">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="kicker">{indicator.group}</p>
                <h3 className="mt-1 display text-2xl text-ink">{indicator.label}</h3>
                <p className="mt-1 text-xs text-ink-3">
                  {indicator.period} · England {formatIndicator(evidence.england[indicator.key], indicator)}
                </p>
              </div>
              {model && r2 !== null ? (
                <div className="text-right">
                  <p className="display text-4xl tabular text-ink">
                    <span className="mr-1 text-xl italic text-ink-3">r</span>
                    {formatSigned(model.r, 2)}
                  </p>
                  <p className="text-xs text-ink-3">lines up with {r2}% of the variation</p>
                </div>
              ) : null}
            </div>
            <div className="mt-4">
              <FactorScatter
                indicator={indicator}
                points={points}
                model={model}
                selected={area}
                yLabel={yLabel}
                colour={SEX_COLOURS[sex]}
                yDomain={yDomain}
                onSelect={(code) => update({ area: code })}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <PlaceSearch areas={searchable} size="sm" placeholder="Highlight a place" onPick={(code) => update({ area: code })} className="w-full sm:w-64" />
              {focus && expected !== null ? (
                <p className="min-w-0 flex-1 text-sm text-ink-2">
                  <Link href={`/area/${focus.code}`} className="font-semibold text-ink hover:underline">
                    {focus.name}
                  </Link>
                  : {formatYears(focus.y)} years, {formatYears(Math.abs(focus.y - expected))} {focus.y >= expected ? "above" : "below"} the line.
                </p>
              ) : (
                <p className="text-sm text-ink-3">Or click a dot.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <p className="mt-20 max-w-3xl border-l-2 border-line pl-4 text-sm leading-relaxed text-ink-3">
        Each measure uses its latest OHID period; life expectancy is ONS {compactPeriod(period)}. Fingertips data fetched{" "}
        {evidence.meta.fetched}. City of London and Isles of Scilly are excluded. Correlation across areas says nothing
        about individuals, and deprivation, behaviour and early deaths are tangled together. The deprivation score
        includes a health domain that counts early deaths, so part of its correlation is built in.{" "}
        <Link href="/about" className="link">
          Methods
        </Link>
        {" · "}
        <Link href={exploreHref({ sex })} className="link">
          Atlas
        </Link>
      </p>
    </div>
  )
}

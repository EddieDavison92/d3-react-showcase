"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CorrelationBars, type CorrelationRow } from "@/components/evidence/CorrelationBars"
import { DeprivationGradient, SEX_COLOURS } from "@/components/evidence/DeprivationGradient"
import { FactorScatter } from "@/components/evidence/FactorScatter"
import { Eyebrow, Segmented } from "@/components/explorer/controls"
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

  useEffect(() => {
    loadLe().then(setLe).catch(() => setLe(null))
    loadEvidence().then(setEvidence).catch(() => setEvidence(null))
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

  const correlations = useMemo(() => {
    if (!le || !evidence) return []
    return evidence.indicators
      .map((indicator) => {
        const model = fit(pairs({ evidence, le, grain: "ltla", key: indicator.key, sex, periodIndex }))
        return model ? { indicator, r: model.r, n: model.n } : null
      })
      .filter((row): row is CorrelationRow => row !== null)
      .sort((a, b) => a.r - b.r)
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
  const focus = points.find((p) => p.code === area) ?? null

  if (!le || !evidence || !indicator) {
    return <p className="py-24 text-center text-sm text-slate-500">Loading…</p>
  }

  const first = deciles[0]
  const last = deciles[deciles.length - 1]
  const gap = (s: "male" | "female") =>
    first?.[s] != null && last?.[s] != null ? last[s]! - first[s]! : null
  const drivers = correlations.filter((c) => c.indicator.group !== OUTCOME_GROUP)
  const outcomes = correlations.filter((c) => c.indicator.group === OUTCOME_GROUP)
  const r2 = model ? Math.round(model.r * model.r * 100) : null
  const expected = focus && model ? model.intercept + model.slope * focus.x : null
  const yLabel = `${sex} life expectancy, ${compactPeriod(period)}`

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            What tracks life expectancy
          </h1>
          <p className="mt-2 text-slate-600">
            Life expectancy at birth across {points.length} English local authorities, set against
            deprivation, behaviour and early death rates from OHID. These are associations between
            areas, not proof of cause.
          </p>
        </div>
        <Segmented
          label="Sex"
          value={sex}
          options={[
            { value: "Male", label: "Male" },
            { value: "Female", label: "Female" },
          ]}
          onChange={(value: SexId) => update({ sex: value.toLowerCase() })}
        />
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div>
            <Eyebrow>Deprivation gap</Eyebrow>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Life expectancy falls with every step of deprivation
            </h2>
            <dl className="mt-4 space-y-3">
              {(["male", "female"] as const).map((s) => (
                <div key={s}>
                  <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: SEX_COLOURS[s === "male" ? "Male" : "Female"] }}
                    />
                    {s === "male" ? "Males" : "Females"}
                  </dt>
                  <dd className="text-2xl font-semibold tabular-nums text-slate-900">
                    {formatYears(gap(s))}
                    <span className="ml-1 text-sm font-normal text-slate-500">years</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Gap between the most and least deprived tenths of local authorities, ranked by IMD
              2025 score. Unweighted mean of areas, {compactPeriod(period)}.
            </p>
          </div>
          <DeprivationGradient rows={deciles} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <Eyebrow>Correlation with {sex.toLowerCase()} life expectancy</Eyebrow>
          <p className="mt-1 text-sm text-slate-600">
            Pearson r across local authorities. −1 means areas with more of it always live shorter
            lives. Pick one to plot it.
          </p>
          <div className="mt-4 space-y-5">
            <CorrelationBars
              title="Circumstances and behaviour"
              rows={drivers}
              selected={indicator.key}
              onSelect={(key) => update({ factor: key })}
            />
            <CorrelationBars
              title="Early deaths — part of life expectancy itself"
              rows={outcomes}
              selected={indicator.key}
              onSelect={(key) => update({ factor: key })}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="font-semibold text-slate-900">{indicator.label}</h2>
            <p className="text-xs text-slate-500">
              {indicator.period} · England {formatIndicator(evidence.england[indicator.key], indicator)}
            </p>
          </div>
          {model && r2 !== null ? (
            <p className="mt-1 text-sm text-slate-600">
              r = {formatSigned(model.r, 2)}. Differences in this measure line up with{" "}
              <span className="font-medium text-slate-900">{r2}%</span> of the variation in{" "}
              {sex.toLowerCase()} life expectancy between areas.
            </p>
          ) : null}
          <div className="mt-3">
            <FactorScatter
              indicator={indicator}
              points={points}
              model={model}
              selected={area}
              yLabel={yLabel}
              onSelect={(code) => update({ area: code })}
            />
          </div>
          {focus && expected !== null ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
              <p className="text-slate-700">
                <span className="font-medium text-slate-900">{focus.name}</span>:{" "}
                {formatYears(focus.y)} years, {formatYears(Math.abs(focus.y - expected))} years{" "}
                {focus.y >= expected ? "above" : "below"} the line for its{" "}
                {indicator.label.toLowerCase()} ({formatIndicator(focus.x, indicator)}).
              </p>
              <Link
                href={exploreHref({ area: focus.code, sex })}
                className="text-xs font-medium text-teal-800 hover:underline"
              >
                Open on map →
              </Link>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Click a dot to pick an area.</p>
          )}
        </div>
      </section>

      <p className="text-xs leading-relaxed text-slate-500">
        Factors use the latest OHID period for each indicator (shown above the chart); life
        expectancy is ONS {compactPeriod(period)}. Fingertips data fetched {evidence.meta.fetched}.
        City of London and Isles of Scilly are excluded. Correlation across areas says nothing
        about individuals, and deprivation, behaviour and early deaths are tangled together.{" "}
        <Link href="/about" className="underline underline-offset-2 hover:text-slate-900">
          Sources and methods
        </Link>
      </p>
    </div>
  )
}

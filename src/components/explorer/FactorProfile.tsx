"use client"

import { useMemo } from "react"
import {
  formatIndicator,
  OUTCOME_GROUP,
  type EvidenceFile,
  type EvidenceGrain,
  type Indicator,
} from "@/lib/explorer/evidence"

const BETTER = "#0f766e"
const WORSE = "#c2410c"

/** One row per indicator: this area against England and the spread of all areas. */
export function FactorProfile({ evidence, code }: { evidence: EvidenceFile; code: string }) {
  const grain: EvidenceGrain | null = evidence.ltla[code] ? "ltla" : evidence.utla[code] ? "utla" : null

  const rows = useMemo(() => {
    if (!grain) return []
    const all = Object.values(evidence[grain])
    return evidence.indicators.map((indicator) => {
      const values = all
        .map((f) => f[indicator.key])
        .filter((v): v is number => typeof v === "number")
      const value = evidence[grain][code]?.[indicator.key] ?? null
      return {
        indicator,
        value,
        england: evidence.england[indicator.key] ?? null,
        min: Math.min(...values),
        max: Math.max(...values),
      }
    })
  }, [code, evidence, grain])

  if (!grain) return <p className="text-sm text-slate-500">No OHID figures for this area.</p>

  const groups = [
    { title: null, rows: rows.filter((r) => r.indicator.group !== OUTCOME_GROUP) },
    { title: "Deaths per 100,000, age-standardised", rows: rows.filter((r) => r.indicator.group === OUTCOME_GROUP) },
  ]

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.title ?? "factors"}>
          {group.title ? (
            <p className="mb-2 text-xs font-medium text-slate-500">{group.title}</p>
          ) : null}
          <ul className="space-y-2.5">
            {group.rows.map((row) => (
              <FactorRow key={row.indicator.key} {...row} />
            ))}
          </ul>
        </div>
      ))}
      <p className="text-[11px] leading-relaxed text-slate-500">
        Strip spans all English {grain === "ltla" ? "local authorities" : "upper-tier authorities"}
        ; tick marks England. Teal is better than England, orange worse. Source: OHID Fingertips.
      </p>
    </div>
  )
}

function FactorRow({
  indicator,
  value,
  england,
  min,
  max,
}: {
  indicator: Indicator
  value: number | null
  england: number | null
  min: number
  max: number
}) {
  const span = max - min || 1
  const at = (v: number) => `${((v - min) / span) * 100}%`
  const worse =
    value !== null && england !== null
      ? indicator.better === "low"
        ? value > england
        : value < england
      : null

  return (
    <li className="text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-slate-700" title={`${indicator.label}, ${indicator.period}`}>
          {indicator.short}
        </span>
        <span className="shrink-0 tabular-nums">
          <span className="font-medium text-slate-900">{formatIndicator(value, indicator)}</span>
          <span className="ml-1.5 text-xs text-slate-400">
            Eng {formatIndicator(england, indicator)}
          </span>
        </span>
      </div>
      <div className="relative mt-1 h-2">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
        {england !== null ? (
          <span
            className="absolute top-0 h-2 w-px bg-slate-500"
            style={{ left: at(england) }}
            aria-hidden
          />
        ) : null}
        {value !== null ? (
          <span
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
            style={{ left: at(value), background: worse ? WORSE : BETTER }}
            aria-hidden
          />
        ) : null}
      </div>
    </li>
  )
}

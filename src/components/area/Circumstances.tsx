import { formatIndicator } from "@/lib/explorer/evidence"
import type { AreaReport } from "@/lib/story/area"

type Row = AreaReport["factors"][number]

const WORSE = "#c0533f"
const BETTER = "#277563"
/** No England figure to compare against. */
const NEUTRAL = "#9a9ea4"

/** One row per indicator: range of all areas, middle half shaded, England ticked. */
export function Circumstances({ rows, peers }: { rows: Row[]; peers: string }) {
  return (
    <ul className="divide-y divide-line/70">
      {rows.map((row) => (
        <FactorRow key={row.indicator.key} row={row} peers={peers} />
      ))}
    </ul>
  )
}

function FactorRow({ row, peers }: { row: Row; peers: string }) {
  const { indicator, value, england, min, max, p25, p75, percentile } = row
  const span = max - min || 1
  const at = (v: number) => `${((v - min) / span) * 100}%`
  const worse = value !== null && england !== null ? value > england : null
  const pct = percentile === null ? null : Math.round(percentile * 100)

  return (
    <li className="grid grid-cols-1 gap-x-6 gap-y-2 py-3.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)_7rem] sm:items-center">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{indicator.short}</p>
        <p className="text-2xs text-ink-3">
          {indicator.unit === "%" || indicator.unit === "score" ? indicator.period : `${indicator.unit}, ${indicator.period}`}
        </p>
      </div>
      <div className="relative h-6" aria-hidden>
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
        <span
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/[0.07]"
          style={{ left: at(p25), width: `${((p75 - p25) / span) * 100}%` }}
        />
        {england !== null ? (
          <span className="absolute top-1/2 h-4 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/50" style={{ left: at(england) }} />
        ) : null}
        {value !== null ? (
          <span
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-[3px] ring-paper"
            style={{ left: at(value), background: worse === null ? NEUTRAL : worse ? WORSE : BETTER }}
          />
        ) : null}
      </div>
      <div className="text-right sm:text-left">
        <p className="tabular text-sm">
          <span className="font-semibold text-ink">{formatIndicator(value, indicator)}</span>
          <span className="ml-1.5 text-ink-3">vs {formatIndicator(england, indicator)}</span>
        </p>
        {pct !== null ? (
          <p className="text-2xs text-ink-3">
            {pct >= 100
              ? `highest of all ${peers}`
              : pct <= 0
                ? `lowest of all ${peers}`
                : pct >= 50
                  ? `higher than ${pct}% of ${peers}`
                  : `lower than ${100 - pct}% of ${peers}`}
          </p>
        ) : null}
      </div>
    </li>
  )
}

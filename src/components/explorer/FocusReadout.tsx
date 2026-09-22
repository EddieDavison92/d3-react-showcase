import { formatCi, formatSigned, formatYears } from "@/lib/explorer/format"
import type { PackedPoint, ViewId } from "@/lib/explorer/types"
import { SEX_GAP_LABEL } from "@/lib/explorer/views"

export function FocusReadout({
  name,
  unit,
  point,
  view,
  derivedValue,
  birthPoint,
  age65Point,
  showAges,
  divergence,
  sexGap,
  vsNation,
  uncertainChange,
  emphasiseCi,
}: {
  name: string
  unit: string
  point: PackedPoint | null
  view: ViewId
  derivedValue?: number | null
  birthPoint?: PackedPoint | null
  age65Point?: PackedPoint | null
  showAges?: boolean
  divergence?: { years: number; grain: string } | null
  sexGap?: {
    male: number | null
    female: number | null
    gap: number | null
    maleCi?: string
    femaleCi?: string
  } | null
  vsNation?: { label: string; delta: number | null; ukDelta?: number | null } | null
  uncertainChange?: boolean
  emphasiseCi?: boolean
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Focus
        </p>
        <p className="text-sm font-medium">{name}</p>
      </div>
      {point && point[0] !== null ? (
        <CiBand point={point} unit={unit} emphasise={emphasiseCi} />
      ) : (
        <p className="text-xs text-muted-foreground">
          Click the map or pick an area to see the series and interval.
        </p>
      )}
      {view !== "absolute" &&
      view !== "sex_gap" &&
      view !== "vs_nation" &&
      view !== "ci" &&
      derivedValue !== null &&
      derivedValue !== undefined ? (
        <p className="text-xs">
          {viewLabel(view)} {formatSigned(derivedValue)} {unit}
          {uncertainChange ? " · change uncertain (CIs overlap)" : ""}
        </p>
      ) : null}
      {sexGap ? (
        <p className="text-xs text-muted-foreground">
          Male {formatYears(sexGap.male)}
          {sexGap.maleCi ? ` (${sexGap.maleCi})` : ""} · Female {formatYears(sexGap.female)}
          {sexGap.femaleCi ? ` (${sexGap.femaleCi})` : ""} · {SEX_GAP_LABEL}{" "}
          {formatSigned(sexGap.gap)}
        </p>
      ) : null}
      {vsNation ? (
        <p className="text-xs text-muted-foreground">
          vs {vsNation.label} {formatSigned(vsNation.delta)}
          {vsNation.ukDelta !== null && vsNation.ukDelta !== undefined
            ? ` · vs UK ${formatSigned(vsNation.ukDelta)}`
            : ""}
        </p>
      ) : null}
      {showAges ? (
        <p className="text-xs text-muted-foreground">
          At birth {formatYears(birthPoint?.[0])} {formatCi(birthPoint ?? null)}
          {" · "}
          at 65 {formatYears(age65Point?.[0])} {formatCi(age65Point ?? null)}
        </p>
      ) : null}
      {divergence ? (
        <p className="text-xs">
          Years not in good health {formatYears(divergence.years)} ({divergence.grain}).{" "}
          <span className="text-muted-foreground">
            Official statistics in development. Grain follows HLE (upper-tier in England).
          </span>
        </p>
      ) : null}
    </div>
  )
}

function CiBand({
  point,
  unit,
  emphasise,
}: {
  point: PackedPoint
  unit: string
  emphasise?: boolean
}) {
  const value = point[0] as number
  const lci = point[1]
  const uci = point[2]
  const hasBand = lci !== null && uci !== null && uci > lci
  const t = hasBand ? (value - (lci as number)) / ((uci as number) - (lci as number)) : 0.5
  return (
    <div className="space-y-1">
      <p className="text-sm tabular-nums">
        {formatYears(value)} {unit}
        {hasBand ? (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {formatCi(point)}
          </span>
        ) : null}
      </p>
      {hasBand ? (
        <div
          className={emphasise ? "h-2.5 rounded-full bg-slate-200" : "h-1.5 rounded-full bg-slate-200"}
        >
          <div className="relative h-full rounded-full bg-teal-700/35">
            <span
              className="absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-teal-900"
              style={{ left: `${Math.max(0, Math.min(1, t)) * 100}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function viewLabel(view: ViewId): string {
  switch (view) {
    case "d2017":
      return "Δ vs 2017–19"
    case "d2019":
      return "Δ vs 2019–21"
    case "vs_nation":
      return "vs nation"
    case "sex_gap":
      return SEX_GAP_LABEL
    case "ci":
      return "CI width"
    default:
      return ""
  }
}

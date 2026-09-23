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
  age,
  divergence,
  sexGap,
  vsNation,
  uncertainChange,
  emphasiseCi,
  figure,
}: {
  name: string
  unit: string
  point: PackedPoint | null
  view: ViewId
  derivedValue?: number | null
  birthPoint?: PackedPoint | null
  age65Point?: PackedPoint | null
  showAges?: boolean
  age?: string
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
  figure?: boolean
}) {
  const level = point?.[0] ?? null
  const hasCi = point != null && point[1] !== null && point[2] !== null
  const derived = derivedLine(view, unit, derivedValue, vsNation, sexGap)

  if (figure) {
    return (
      <div className="focus-card-enter rounded-xl border border-slate-200/70 bg-white/95 px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.22)] backdrop-blur-sm">
        <p className="text-sm font-semibold leading-tight">{name}</p>
        {level !== null ? (
          <>
            <p className="mt-1.5 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-[2rem]">
              {formatYears(level)}
              <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">
                {unit}
              </span>
            </p>
            {hasCi ? (
              <p
                className={
                  emphasiseCi
                    ? "mt-1 text-xs font-medium tabular-nums text-foreground"
                    : "mt-1 text-xs tabular-nums text-muted-foreground"
                }
              >
                {formatCi(point)}
              </p>
            ) : null}
            {derived ? (
              <p className="mt-2.5 border-t border-slate-200/70 pt-2.5 text-sm font-medium tabular-nums text-foreground">
                {derived}
              </p>
            ) : null}
            {sexGap ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                Male {formatYears(sexGap.male)} · Female {formatYears(sexGap.female)}
              </p>
            ) : null}
            {uncertainChange ? (
              <p className="text-xs text-muted-foreground">Change uncertain — intervals overlap</p>
            ) : null}
            {vsNation?.ukDelta !== null && vsNation?.ukDelta !== undefined ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                vs UK {formatSigned(vsNation.ukDelta)} {unit}
              </p>
            ) : null}
            {showAges || divergence ? (
              <div className="mt-2.5 hidden space-y-1 border-t border-slate-200/70 pt-2.5 text-xs leading-snug text-muted-foreground sm:block">
                {showAges ? (
                  <p className="tabular-nums">
                    {age === "65"
                      ? `At birth ${formatYears(birthPoint?.[0])} ${unit} · ${formatCi(birthPoint ?? null)}`
                      : `At 65 ${formatYears(age65Point?.[0])} ${unit} · ${formatCi(age65Point ?? null)}`}
                  </p>
                ) : null}
                {divergence ? (
                  <p>
                    Years not in good health {formatYears(divergence.years)} ({divergence.grain}).
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">No figure for this selection.</p>
        )}
      </div>
    )
  }

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
      {derived ? <p className="text-xs tabular-nums">{derived}</p> : null}
      {uncertainChange ? (
        <p className="text-xs text-muted-foreground">Change uncertain — intervals overlap</p>
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

function derivedLine(
  view: ViewId,
  unit: string,
  derivedValue?: number | null,
  vsNation?: { label: string; delta: number | null } | null,
  sexGap?: { gap: number | null } | null
): string | null {
  if (view === "d2017" && derivedValue !== null && derivedValue !== undefined) {
    return `Δ since 2017–19: ${formatSigned(derivedValue)} ${unit}`
  }
  if (view === "d2019" && derivedValue !== null && derivedValue !== undefined) {
    return `Δ since 2019–21: ${formatSigned(derivedValue)} ${unit}`
  }
  if (view === "vs_nation" && vsNation) {
    return `vs ${vsNation.label}: ${formatSigned(vsNation.delta)} ${unit}`
  }
  if (view === "sex_gap" && sexGap && sexGap.gap !== null && sexGap.gap !== undefined) {
    return `${SEX_GAP_LABEL} ${formatSigned(sexGap.gap)} ${unit}`
  }
  return null
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

"use client"

import { useSize } from "@/components/story/use-size"
import { decileColour, DIVERGING, INK, INK_3, LINE, PAPER } from "@/lib/story/palette"

/** Deaths per 100,000 that one dot stands for. */
const UNIT = 5
const MORE = DIVERGING[1]
const FEWER = DIVERGING[7]
const POP = "cubic-bezier(0.34,1.56,0.64,1)"

/**
 * Avoidable death rate per deprivation tenth as rows of dots, one per UNIT
 * deaths per 100,000. Brick dots were added since the earlier period; hollow
 * teal rings were lost. Dots fill in left to right when active.
 */
export function AvoidableDots({
  rows,
  label,
  shortLabel = label,
  periods,
  active,
}: {
  /** One per tenth, most deprived first. */
  rows: { then: number | null; now: number | null }[]
  label: string
  shortLabel?: string
  periods: { then: string; now: string }
  active: boolean
}) {
  const [ref, { width, height }] = useSize<HTMLDivElement>()
  const narrow = width < 560
  const M = { top: narrow ? 98 : 84, right: narrow ? 56 : 96, bottom: 44, left: narrow ? 28 : 128 }
  const w = Math.max(10, width - M.left - M.right)
  const h = Math.max(10, height - M.top - M.bottom)
  const counts = rows.map((r) => ({
    now: r.now === null ? null : Math.round(r.now / UNIT),
    then: r.then === null ? null : Math.round(r.then / UNIT),
  }))
  const most = Math.max(1, ...counts.flatMap((c) => [c.now ?? 0, c.then ?? 0]))
  const step = h / 10
  // Wrap each row onto as many lines as gives the largest dots.
  const { lines, pitch } = [1, 2, 3, 4, 5]
    .map((n) => ({ lines: n, pitch: Math.min(22, w / Math.ceil(most / n), (step * 0.72) / n) }))
    .reduce((a, b) => (b.pitch > a.pitch ? b : a))
  const r = pitch * 0.36
  const cols = (n: number) => Math.ceil(n / lines)
  // Rate at a given x, for the axis: each column holds `lines` dots.
  const xOf = (rate: number) => (rate / UNIT / lines) * pitch
  const least = counts[9].now
  const reveal = (col: number, d: number) => (active ? 200 + col * 16 + d * 30 : 0)

  return (
    <div ref={ref} className="relative h-full w-full">
      <svg width={width} height={height} className="chart" role="img" aria-label={`${label}, by deprivation tenth`}>
        <g transform={`translate(${M.left},${M.top})`}>
          <text x={-M.left} y={-58} fontSize={10.5} fill={INK_3}>
            {narrow ? shortLabel : label}
          </text>
          <g transform={`translate(${-M.left},-34)`} style={{ opacity: active ? 1 : 0, transition: "opacity 400ms 600ms" }}>
            <circle cx={5} cy={-3.5} r={4.5} fill={decileColour(4)} />
            <text x={15} fontSize={10.5} fill={INK_3}>
              {UNIT} deaths per 100,000 a year, {periods.now}
            </text>
            <g transform={`translate(${narrow ? 0 : 236},${narrow ? 16 : 0})`}>
              <circle cx={5} cy={-3.5} r={4.5} fill={MORE} />
              <text x={15} fontSize={10.5} fill={INK_3}>
                more than {periods.then}
              </text>
              <circle cx={140} cy={-3.5} r={3.75} fill="none" stroke={FEWER} strokeWidth={1.5} />
              <text x={150} fontSize={10.5} fill={INK_3}>
                fewer
              </text>
            </g>
          </g>

          {[100, 200, 300, 400].filter((t) => xOf(t) <= w).map((t) => (
            <g key={t} transform={`translate(${xOf(t)},${h})`}>
              <line y1={4} y2={9} stroke={INK_3} />
              <text y={24} textAnchor="middle" fontSize={10.5} fill={INK_3}>
                {t}
              </text>
            </g>
          ))}

          {/* The least deprived tenth's length, carried up every row. */}
          {least !== null ? (
            <g style={{ opacity: active ? 1 : 0, transition: `opacity 500ms ${active ? 1300 : 0}ms` }}>
              <line x1={cols(least) * pitch} x2={cols(least) * pitch} y1={-8} y2={h} stroke={INK} strokeDasharray="2 3" opacity={0.55} />
              <text x={cols(least) * pitch + 6} y={-8} fontSize={10.5} fill={INK}>
                {narrow ? "least deprived" : "least deprived tenth"}
              </text>
            </g>
          ) : null}

          {counts.map((c, d) => {
            if (c.now === null) return null
            const total = Math.max(c.now, c.then ?? 0)
            const top = d * step + (step - lines * pitch) / 2
            const end = cols(total) * pitch
            const row = rows[d]
            const change = row.then === null || row.now === null ? null : Math.round(row.now - row.then)
            return (
              <g key={d} transform={`translate(0,${top})`}>
                <text x={-12} y={(lines * pitch) / 2} dy="0.32em" textAnchor="end" fontSize={11} fill={INK}>
                  {narrow ? d + 1 : d === 0 ? "1 · most deprived" : d === 9 ? "10 · least" : d + 1}
                </text>
                <line x1={0} x2={w} y1={(lines * pitch) / 2} y2={(lines * pitch) / 2} stroke={LINE} opacity={0.5} />
                {Array.from({ length: total }, (_, k) => {
                  const col = Math.floor(k / lines)
                  const lost = k >= c.now!
                  const added = !lost && c.then !== null && k >= c.then
                  return (
                    <circle
                      key={k}
                      cx={col * pitch + pitch / 2}
                      cy={(k % lines) * pitch + pitch / 2}
                      r={lost ? r - 0.75 : r}
                      fill={lost ? PAPER : added ? MORE : decileColour(d + 1)}
                      stroke={lost ? FEWER : "none"}
                      strokeWidth={1.5}
                      style={{
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        transform: `scale(${active ? 1 : 0})`,
                        transition: `transform 450ms ${POP} ${reveal(col, d)}ms`,
                      }}
                    />
                  )
                })}
                <text
                  x={end + 10}
                  y={(lines * pitch) / 2}
                  dy="0.32em"
                  fontSize={12}
                  fill={INK}
                  stroke={PAPER}
                  strokeWidth={4}
                  paintOrder="stroke"
                  style={{ opacity: active ? 1 : 0, transition: `opacity 300ms ${reveal(cols(total), d)}ms` }}
                >
                  <tspan fontWeight={600}>{Math.round(row.now!)}</tspan>
                  {change !== null ? (
                    <tspan dx={6} fontSize={11} fill={change > 0 ? MORE : FEWER}>
                      {change === 0 ? "±0" : `${change > 0 ? "+" : "−"}${Math.abs(change)}`}
                    </tspan>
                  ) : null}
                </text>
              </g>
            )
          })}
          <text x={w} y={h + 40} textAnchor="end" fontSize={10.5} fill={INK_3}>
            Deaths per 100,000 →
          </text>
        </g>
      </svg>
    </div>
  )
}

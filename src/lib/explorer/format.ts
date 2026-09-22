export function compactPeriod(period: string): string {
  const match = period.match(/^(\d{4}) to (\d{4})$/)
  if (!match) return period
  return `${match[1]}-${match[2].slice(2)}`
}

export function expandPeriod(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})$/)
  if (!match) return value.replace(/-/g, " to ")
  return `${match[1]} to ${match[1].slice(0, 2)}${match[2]}`
}

export function formatYears(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–"
  return value.toFixed(digits)
}

export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "–"
  return value.toFixed(1)
}

export function nearestPeriod(wanted: string, periods: string[]): string {
  if (periods.includes(wanted)) return wanted
  const start = parseInt(wanted.slice(0, 4), 10)
  if (!Number.isFinite(start) || periods.length === 0) return periods[periods.length - 1]
  let best = periods[0]
  let bestDist = Infinity
  for (const period of periods) {
    const dist = Math.abs(parseInt(period.slice(0, 4), 10) - start)
    if (dist < bestDist) {
      best = period
      bestDist = dist
    }
  }
  return best
}

export function periodOverlapsPandemic(period: string): boolean {
  const start = parseInt(period.slice(0, 4), 10)
  const end = parseInt(period.slice(-4), 10)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false
  return start <= 2022 && end >= 2020
}

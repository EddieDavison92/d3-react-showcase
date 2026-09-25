/** Shared by the story data (server) and the comparison chart (client). */

export type CompareRow = {
  key: string
  group: number
  label: string
  /** Who and when, e.g. "men, 2022–24". */
  note: string
  unit: "%" | "rate" | "score"
  low: number | null
  high: number | null
  england: number | null
  /** OHID flags the value with a data quality issue; it isn't compared. */
  lowFlag: boolean
  highFlag: boolean
}

export const COMPARE_GROUPS = ["Deaths under 75", "Behaviour", "Circumstances"]

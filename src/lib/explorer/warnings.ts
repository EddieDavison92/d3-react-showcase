import type { ExplorerWarning } from "./types"

/** Notes shown when a change of measure or area moves the selection. */
export const WARNING_COPY = {
  ltlaUtla: {
    id: "ltla-utla",
    tone: "mismatch",
    title: "Showing the upper-tier area",
    body: "In England, healthy life expectancy is only published for counties and unitary authorities.",
  },
  nationDeprivation: {
    id: "nation-deprivation",
    tone: "mismatch",
    title: "Deprivation is ranked within each nation",
    body: "Each UK nation has its own index, so ranks can't be compared across nations.",
  },
  avoidableEw: {
    id: "avoidable-ew",
    tone: "mismatch",
    title: "England and Wales only",
    body: "ONS publishes avoidable mortality for England and Wales, not Scotland or Northern Ireland.",
  },
  noPersons: {
    id: "no-persons",
    tone: "mismatch",
    title: "Male and female only",
    body: "ONS publishes local life expectancy for males and females separately, with no persons figure.",
  },
  periodSnap: {
    id: "period-snap",
    tone: "mismatch",
    title: "Moved to the nearest available period",
    body: "This measure doesn't cover the period you were viewing.",
  },
  wimdEmpty: {
    id: "wimd-empty",
    tone: "empty",
    title: "No Welsh deprivation index here",
    body: "Only England's Indices of Deprivation are included.",
  },
  scotNiDeprivation: {
    id: "scot-ni-deprivation",
    tone: "empty",
    title: "No Scottish or Northern Irish deprivation index here",
    body: "Only England's Indices of Deprivation are included.",
  },
} as const satisfies Record<string, ExplorerWarning>

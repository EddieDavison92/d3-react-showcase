import type { ExplorerWarning } from "./types"

export const WARNING_COPY = {
  ltlaUtla: {
    id: "ltla-utla",
    tone: "mismatch",
    title: "District and upper-tier areas do not match one-for-one",
    body: "Life expectancy here is shown for districts and unitaries. Healthy life expectancy from ONS is published for upper-tier areas in England (counties and unitaries), so two-tier shire districts won’t match one-for-one. We’re showing the upper-tier figure that contains this area.",
  },
  localAreasMix: {
    id: "local-areas-mix",
    tone: "always",
    title: "Counties are a separate geography",
    body: "The ONS file labels both districts and counties as Local Areas. This explorer keeps them as separate geography choices so a county isn’t compared as if it were a district.",
  },
  nationDeprivation: {
    id: "nation-deprivation",
    tone: "mismatch",
    title: "Nation indices are not comparable",
    body: "Each UK nation has its own deprivation index. Ranks and scores aren’t comparable across nations — there isn’t a single UK deprivation league table.",
  },
  avoidableEw: {
    id: "avoidable-ew",
    tone: "always",
    title: "England and Wales only",
    body: "Avoidable mortality in this explorer: England and Wales only.",
  },
  periodLe: {
    id: "period-le",
    tone: "always",
    title: "Period life expectancy is not a forecast",
    body: "Period life expectancy summarises death rates in the selected years — not a forecast for individuals.",
  },
  hleDevelopment: {
    id: "hle-development",
    tone: "always",
    title: "Official statistics in development",
    body: "Healthy life expectancy: official statistics in development; geography may differ from period LE.",
  },
  countryLe: {
    id: "country-le",
    tone: "always",
    title: "Country totals are comparators",
    body: "Country totals here are for comparison with local areas. For official country life expectancy, ONS points to the National life tables release.",
  },
  noPersons: {
    id: "no-persons",
    tone: "mismatch",
    title: "No combined persons figure",
    body: "ONS publishes local life expectancy and healthy life expectancy for males and females separately in these datasets — not a combined persons figure.",
  },
  deprivationNotCause: {
    id: "deprivation-not-cause",
    tone: "always",
    title: "Context, not a cause",
    body: "Deprivation is context only — not a cause of life expectancy.",
  },
  periodSnap: {
    id: "period-snap",
    tone: "mismatch",
    title: "Period snapped to available years",
    body: "This series does not include the period you were viewing. We’ve moved to the nearest overlapping window.",
  },
  wimdEmpty: {
    id: "wimd-empty",
    tone: "empty",
    title: "Wales index not in this explorer",
    body: "Wales index not in this explorer (different index from England).",
  },
  scotNiDeprivation: {
    id: "scot-ni-deprivation",
    tone: "empty",
    title: "SIMD / NIMDM not included",
    body: "SIMD / NIMDM not included — not a UK ranking.",
  },
  ciSmall: {
    id: "ci-small",
    tone: "always",
    title: "Uncertainty is wider in smaller populations",
    body: "Treat rankings of small areas cautiously — check the confidence interval before reading a big rise or fall as a firm change.",
  },
} as const satisfies Record<string, ExplorerWarning>

"use client"

import { Segmented, Select } from "@/components/explorer/controls"
import { PlaceSearch } from "@/components/story/PlaceSearch"
import { familyOf, geoLabel, geosFor, hasAge, sexesFor } from "@/lib/explorer/catalogue"
import type { SearchableArea } from "@/lib/explorer/place-find"
import { VIEW_OPTIONS, viewsFor } from "@/lib/explorer/views"
import type { AgeId, ExplorerState, GeoId, MetricId, SexId, ViewId } from "@/lib/explorer/types"
import { FEMALE, MALE } from "@/lib/story/palette"
import { cn } from "@/lib/utils"

const FAMILIES: { id: MetricId; label: string; note: string }[] = [
  { id: "le", label: "Life expectancy", note: "UK, 2001–03 to 2022–24" },
  { id: "hle", label: "Healthy life expectancy", note: "UK, upper tier in England" },
  { id: "avoidable", label: "Avoidable deaths", note: "England and Wales, per 100,000" },
]

export function ControlPanel({
  state,
  places,
  onChange,
  onPick,
  collapsed = false,
}: {
  state: ExplorerState
  places: SearchableArea[]
  onChange: (patch: Partial<ExplorerState>) => void
  onPick: (code: string) => void
  /** Phones: show only search; the rest folds away until opened. */
  collapsed?: boolean
}) {
  const family = familyOf(state.metric)
  const views = viewsFor(state.metric)
  const sexes = sexesFor(state.metric)

  return (
    <div className="space-y-5">
      <PlaceSearch areas={places} size="sm" onPick={onPick} placeholder="Find a place or postcode" />
      <div className={cn("space-y-5", collapsed && "hidden lg:block")}>

      <fieldset>
        <legend className="kicker mb-2">Measure</legend>
        <div className="space-y-1">
          {FAMILIES.map((m) => {
            const active = familyOf(m.id) === family
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChange({ metric: m.id })}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                  active ? "bg-white shadow-sm ring-1 ring-ink/5" : "hover:bg-white/60"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-brand" : "border-ink/25"
                  )}
                >
                  {active ? <span className="h-2 w-2 rounded-full bg-brand" /> : null}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm", active ? "font-medium text-ink" : "text-ink-2")}>{m.label}</span>
                  <span className="block text-2xs text-ink-3">{m.note}</span>
                </span>
              </button>
            )
          })}
        </div>
        {family === "avoidable" ? (
          <Segmented
            className="mt-2 w-full"
            label="Type of avoidable death"
            value={state.metric}
            options={[
              { value: "avoidable", label: "All" },
              { value: "preventable", label: "Preventable" },
              { value: "treatable", label: "Treatable" },
            ]}
            onChange={(metric: MetricId) => onChange({ metric })}
          />
        ) : null}
      </fieldset>

      <div className="grid gap-2">
        <p className="kicker">Who</p>
        <Segmented
          className="w-full"
          label="Sex"
          value={state.sex}
          disabled={state.view === "sex_gap"}
          options={sexes.map((sex) => ({
            value: sex,
            label: sex === "Male" ? "Men" : sex === "Female" ? "Women" : "All",
            dot: sex === "Male" ? MALE : sex === "Female" ? FEMALE : undefined,
          }))}
          onChange={(sex: SexId) => onChange({ sex })}
        />
        {hasAge(state.metric) ? (
          <Segmented
            className="w-full"
            label="Age"
            value={state.age}
            options={[
              { value: "birth", label: "At birth" },
              { value: "65", label: "At 65" },
            ]}
            onChange={(age: AgeId) => onChange({ age })}
          />
        ) : null}
      </div>

      <div className="grid gap-2">
        <p className="kicker">Show</p>
        {views.length > 1 ? (
          <Select
            label="Show"
            value={state.view}
            options={VIEW_OPTIONS.filter((v) => views.includes(v.id)).map((v) => ({ value: v.id, label: v.label }))}
            onChange={(view: ViewId) => onChange({ view })}
          />
        ) : null}
        <Select
          label="Geography"
          value={state.geo}
          options={geosFor(state.metric).map((geo) => ({ value: geo, label: geoLabel(geo) }))}
          onChange={(geo: GeoId) => onChange({ geo, area: null })}
        />
      </div>
      </div>
    </div>
  )
}
